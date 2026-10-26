# Test fixtures

## Source files

| File                                        | Purpose                                                                                                                                                        |
|---------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sample1.js`, `sample2.js` and `sample3.js` | Three implementations of the same programming problem. Used as a primary input in CLI and unit tests.                                                          |
| `sample_ignore.js`                          | Shared boilerplate code that appears in the sample implementations. Used to verify that the `--ignore` option correctly excludes specified code from analysis. |
| `sample_ignore_inert.js`                    | A template that shares no fingerprints with the samples. Used to verify that ignoring it leaves the similarity unchanged.                                       |
| `sample1.py` and `sample2.py`               | Two Python implementations of the same problem. Used to test language detection and the filtering of input files by language.                                 |


## Reader directory and archives

`reader/` contains `sample1.js`, `sample2.js`, and an `info.csv` manifest listing those
two files. The four archives (`reader.zip`, `reader.tar`, `reader.tar.gz`,
`reader.tar.bz2`) each contain the same two JS files at the archive root.

When `sample1.js` or `sample2.js` are updated, you need to update `reader/` and regenerate the archives:

```sh
cd dolos-lib/fixtures

cp sample1.js sample2.js reader/
zip reader.zip sample1.js sample2.js
tar -cf reader.tar sample1.js sample2.js
tar -czf reader.tar.gz sample1.js sample2.js
tar -cjf reader.tar.bz2 sample1.js sample2.js
```

## JSON fixtures

These files are generated from `sample1.js` (with comments excluded).

| File(s)                                         | Description                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `sample.tokens.json`                            | Token sequence produced by Tree-sitter                                                            |
| `sample.hashes.json`                            | Hash value for each token                                                                         |
| `sample.rolling3.json`, `sample.rolling17.json` | Rolling-hash sequences for k=3 and k=17                                                           |
| `sample.winnowk{k}w{w}.hashes.json`             | Winnowed fingerprint hashes for the test configurations (k=3, w=5), (k=16, w=8), and (k=17, w=23) |
| `sample.winnowk{k}w{w}.locations.json`          | Source locations corresponding to each fingerprint                                                |

After modifying `sample1.js`, regenerate the fixtures with:

```sh
cargo test --features all-languages -- --ignored generate_sample_fixtures
```
