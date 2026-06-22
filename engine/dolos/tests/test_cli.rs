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

// ── Smoke tests ───────────────────────────────────────────────────────────────

#[test]
fn smoke_terminal() {
    dolos_run(&[SAMPLE1, SAMPLE2], &[])
        .assert()
        .success()
        .stdout(predicate::str::contains("sim:"));
}

#[test]
fn smoke_csv_output() {
    let tmp = TempDir::new().unwrap();
    #[rustfmt::skip]
    dolos_run(
        &[SAMPLE1, SAMPLE2],
        &[
            "-f", "csv",
            "-n", "report",
            "-o", tmp.path().to_str().unwrap(),
        ],
    )
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
