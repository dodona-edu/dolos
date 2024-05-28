# Running Dolos CLI

This tutorial describes how you can perform source code plagiarism detection by running Dolos on your local system.
It uses a sample set of source files contained in this [ZIP-file](/simple-dataset.zip).
Download the ZIP-file and extract the source files if you want to run the analysis yourself.
On Unix, this can be done by running the following commands in your terminal:

```shell
wget https://dolos.ugent.be/simple-dataset.zip    # download the ZIP archive
unzip simple-dataset.zip                          # extract the ZIP archive
ls                                                # list extracted source files 
# another_copied_function.js  copied_function.js  copy_of_sample.js info.csv sample.js
```

## Simple start

The easiest way to detect plagiarism by running the Dolos CLI is to
set the programming language using the `-l` or `--language` flag
and pass it a list of all files you want to inspect:

```shell
dolos run -l javascript another_copied_function.js copied_function.js copy_of_sample.js sample.js
# or shorter using file globbing (does not work on Windows)
dolos run -l javascript *.js
# or by passing an info.csv file
dolos run -l javascript info.csv
# or by passing a ZIP-archive
dolos run -l javascript simple-dataset.zip
```

The output in your terminal should look like this:

```
File path                    File path                    Similarity  Longest        Total overlap
                                                                      fragment
copy_of_sample.js            sample.js                    1           93             186
another_copied_function.js   copy_of_sample.js            0.350427    14             41
another_copied_function.js   sample.js                    0.350427    14             41
copied_function.js           copy_of_sample.js            0.153846    8              16
copied_function.js           sample.js                    0.153846    8              16
```

::: tip
You can show all command line options by passing the `-h` or `--help` flag or by running `dolos help run`.
:::

## Adding metadata

You can improve the plagiarism detection report by adding metadata to your submissions (submission time, labels, author name, ...).
See the page about [adding metadata](/docs/adding-metadata) to see how.

## Ignoring template code

Programming exercises often have code in common that is not plagiarised. For example: class and method definitions, given test cases, boilerplate code, ...
Dolos will often detect these code fragments as similar and include them in the similarity score, making it harder to spot actual plagiarism.

With the `-i <path>` or `--ignore <path>` parameter, you can add an _ignore_ file (often also called a _template_ or _boilerplate_) to the analysis.
Code fragments from analysed solutions that match with this file will be ignored and these fingerprints will not count towards similarity.

In addition, it is also possible to **automatically detect** common code.
By passing `-m <integer>` or `--max-fingerprint-count <integer>` you can specify a maximum number of files a code fragment can occur in before it is ignored.
With `-M <fraction>` or `--max-fingerprint-percentage <fraction>` it is possible to specify this number as a fraction (percentage) of the total analysed file count.
It is possible to combine this with specifying an ignore file with the `-i` option.


Example usage:

```sh
# Ignore all code fragments occurring in more than half of the files,
# or occurring in template.js
dolos run -M 0.5 -i template.js solutions/*.js 
```

## Modifying plagiarism detection parameters

The plagiarism detection parameters can be altered by passing the relevant arguments when running Dolos.
See [how Dolos works](/about/algorithm.html) for more information about what influence these parameters have on an analysis.

If running Dolos takes too long or consumes too much memory, tweaking these parameters might help.
We recommend to increase the **window length** (`-w`) first, before altering the **_k_-gram length** (`-k`).

### Window length

Short: `-w <integer>`, long: `--kgrams-in-window <integer>`, default: `17`.

Sets window length (in _k_-grams) used by the [winnowing algorithm](/about/algorithm.html).
The winnowing algorithm selects one _k_-grams from each overlapping window of `w` subsequent _k_-grams.
This may result in a `w`-fold reduction of the memory usage.

Larger values decrease memory usage and runtime, but result in fewer detections and therefore also decrease the accuracy of plagiarism detection.

### _k_-gram length

Short: `-k <integer>`, long: `--kgram-length <integer>`, default: `23`.

Sets the number of _tokens_ in a _k_-gram.
This determines the shortest matchable unit:
common fragments between two files that are shorter than $$k$$ tokens will not be found during plagiarism detection.

Larger values decrease memory usage and runtime, but result in fewer detections and therefore also decrease the accuracy of plagiarism detection.

### Other parameters

Dolos has other parameters that influence a plagiarism detection analysis.
Run `dolos --help` for a more detailed listing of these parameters and a description of their impact.

## Output format

Set the `-f` or `--output-format` flag to specify how Dolos reports its analysis results.
Formatting options are:

 - **terminal**: outputs analysis results in your terminal in plain text format (default)
 - **csv**: outputs results as a directory containing CSV-files
 - **web**: opens an interactive web app in your browser that allows a visual exploration of the analysis results

Use the **web** option to explore the plagiarism detection results in an interactive web app:

```shell
dolos run -f web -l javascript *.js
```

This will display an analysis report in your browser,
giving you the most interactive way to explore the results of plagiarism detection.
By default, the report is available at <http://localhost:3000>.

The report should look like [this](https://dolos.ugent.be/demo/sample/).

## Serving generated reports

Running Dolos with `-f web` or `-f csv` creates a new directory in the current working directory containing the analysis report in CSV-format.

You can manually launch an interactive web app to explore to these analysis results,
without having to re-analyze the source files, by running the following command:

```shell
dolos serve dolos-report-20210831T141228596Z/
```

This will open the same web app as if you launched Dolos with the `-f web` option.
