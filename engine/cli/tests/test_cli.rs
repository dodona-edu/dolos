use assert_cmd::Command;
use predicates::prelude::*;
use tempfile::TempDir;

const SAMPLE1: &str = "fixtures/sample1.js";
const SAMPLE2: &str = "fixtures/sample2.js";

fn dolos_run(files: &[&str], args: &[&str]) -> Command {
    let mut cmd = Command::cargo_bin("dolos").unwrap();
    cmd.arg("run").args(files).args(args);
    cmd
}

fn assert_csv_header(path: &std::path::Path, expected: &[&str]) {
    assert!(path.exists(), "{} does not exist", path.display());
    let mut reader = csv::Reader::from_path(path).unwrap();
    assert_eq!(reader.headers().unwrap(), expected);
}

/// The `files.csv` rows, without the header.
fn read_rows(path: &std::path::Path) -> Vec<csv::StringRecord> {
    csv::Reader::from_path(path)
        .unwrap()
        .records()
        .map(Result::unwrap)
        .collect()
}

// ── Smoke tests ───────────────────────────────────────────────────────────────

#[test]
fn smoke_terminal() {
    dolos_run(&[SAMPLE1, SAMPLE2], &[])
        .assert()
        .success()
        .stdout(predicate::str::contains("sim:"));
}

/// Run a CSV report into a fresh directory and return that directory.
fn csv_report(tmp: &TempDir, extra: &[&str]) -> std::path::PathBuf {
    let report_dir = tmp.path().join("report");
    #[rustfmt::skip]
    let args = [
        "-f", "csv",
        "-n", "report",
        "-o", report_dir.to_str().unwrap(),
    ];
    dolos_run(&[SAMPLE1, SAMPLE2], &[&args[..], extra].concat())
        .assert()
        .success();
    report_dir
}

#[test]
#[rustfmt::skip]
fn csv_output_headers() {
    let tmp = TempDir::new().unwrap();
    // -o is the exact report directory; it must not exist yet.
    let report_dir = csv_report(&tmp, &[]);

    // Files are written directly into the given directory, no subfolder.
    assert_csv_header(&report_dir.join("metadata.csv"), &["property", "value"]);
    assert_csv_header(
        &report_dir.join("files.csv"),
        &["id", "path", "content", "fingerprints", "fingerprint_regions", "ignored_intervals"],
    );
    assert_csv_header(
        &report_dir.join("pairs.csv"),
        &["file1_id", "file1_path", "file2_id", "file2_path", "similarity", "longest", "total_left", "total_right", "overlap_left", "overlap_right"],
    );
    assert_csv_header(
        &report_dir.join("fragments.csv"),
        &["file1_id", "file1_path", "file1_start_point", "file1_end_point", "file2_id", "file2_path", "file2_start_point", "file2_end_point", "fingerprint_count"],
    );
}

/// The analysis-data columns stay empty unless the flag is given.
#[test]
fn analysis_data_columns_are_empty_by_default() {
    let tmp = TempDir::new().unwrap();
    let report_dir = csv_report(&tmp, &[]);

    for row in read_rows(&report_dir.join("files.csv")) {
        assert_eq!(&row[3], "");
        assert_eq!(&row[4], "");
        assert_eq!(&row[5], "");
    }
}

/// With `--include-analysis-data` every file lists its fingerprints and four
/// region numbers per fingerprint.
#[test]
fn analysis_data_columns_hold_numbers() {
    let tmp = TempDir::new().unwrap();
    let report_dir = csv_report(&tmp, &["--include-analysis-data"]);

    // The fingerprint count of each fixture, with the default kgram and window.
    let expected = [(SAMPLE1, 96), (SAMPLE2, 108)];

    let count = |cell: &str| cell.trim_matches(['[', ']']).split(',').count();

    let rows = read_rows(&report_dir.join("files.csv"));
    assert_eq!(rows.len(), expected.len());
    for (row, (path, fingerprints)) in rows.iter().zip(expected) {
        assert_eq!(&row[1], path);
        assert_eq!(count(&row[3]), fingerprints);
        assert_eq!(count(&row[4]), 4 * fingerprints);
        // Nothing is ignored without a template or a frequency cap.
        assert_eq!(&row[5], "[]");
    }
}

#[test]
fn csv_output_default_destination() {
    let tmp = TempDir::new().unwrap();
    // Absolute fixture paths so they still resolve after changing the cwd.
    let manifest = env!("CARGO_MANIFEST_DIR");
    let sample1 = format!("{manifest}/{SAMPLE1}");
    let sample2 = format!("{manifest}/{SAMPLE2}");
    // No -o: an auto-named `dolos-report-*` directory is created in the cwd.
    dolos_run(&[&sample1, &sample2], &["-f", "csv"])
        .current_dir(tmp.path())
        .assert()
        .success();

    let report_dir = std::fs::read_dir(tmp.path())
        .unwrap()
        .map(|e| e.unwrap().path())
        .find(|p| {
            p.file_name()
                .and_then(|n| n.to_str())
                .is_some_and(|s| s.starts_with("dolos-report-"))
        })
        .expect("report directory not created");

    assert!(report_dir.join("pairs.csv").exists());
    assert!(report_dir.join("metadata.csv").exists());
    assert!(report_dir.join("files.csv").exists());
    assert!(report_dir.join("fragments.csv").exists());
}

#[test]
fn csv_output_errors_when_directory_exists() {
    let tmp = TempDir::new().unwrap();
    // The destination already exists, so the run must fail.
    dolos_run(
        &[SAMPLE1, SAMPLE2],
        &["-f", "csv", "-o", tmp.path().to_str().unwrap()],
    )
    .assert()
    .failure()
    .stderr(predicate::str::contains("already exists"));
}

// ── Error surfacing ───────────────────────────────────────────────────────────

#[test]
fn test_errors_reach_process() {
    dolos_run(&[SAMPLE1, SAMPLE2], &["-k", "0"])
        .assert()
        .failure()
        .stderr(predicate::str::contains("must be at least 1"));

    dolos_run(&[SAMPLE1, SAMPLE2], &["-l", "notalang"])
        .assert()
        .failure()
        .stderr(predicate::str::contains("unknown language"));
}
