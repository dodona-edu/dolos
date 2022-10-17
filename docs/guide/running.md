# Running Dolos

If you want to follow along, we have provided a [ZIP with sample files](/simple-dataset.zip).
Download and extract this in your terminal.

On Unix, you can accomplish this using the following commands:

```shell
wget https://dolos.ugent.be/simple-dataset.zip
unzip simple-dataset.zip
ls
# another_copied_function.js  copied_function.js  copy_of_sample.js info.csv sample.js
```

## Simple start

The simplest way to run Dolos is to set the language using the `-l` or `--language`
flag and pass it a list of all the files you want to analyze:

```shell
dolos run -l javascript another_copied_function.js  copied_function.js  copy_of_sample.js  sample.js
# or shorter using file globbing (does not work on Windows)
dolos run -l javascript *.js
# or by passing the info.csv
dolos run -l javascript info.csv
```
The output in your terminal will should look like this:
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
You can show all the command-line options by passing the `-h` or `--help` flag
or by running `dolos help run`.
:::

## Passing metadata

You can improve your analysis results by giving a CSV-file instead of a list of file. This file can contain extra metadata for each submission. However, only the row `filename` with the path to each submission is required.

In addition, you can add the following rows to enhance the results:
- `createdAt`: the timestamp at which the submission was handed in
- `fullName`: the full name of the author of the submission
- `labels`: label used to group submissions together

```shell
dolos run -l javascript info.csv
```

## Passing a ZIP-archive

It is also possible to pass a ZIP-file with an `info.csv` file in it as argument to Dolos.

```shell
dolos run -l javascript simple-dataset.zip
```

## Modifying analysis parameters

The analysis parameters can be altered by passing the relevant program
arguments. For more information about the impact of these parameters you can
read the section describing [how Dolos works](./algorithm.html).

If a Dolos analysis is taking too long or consuming too much memory, it can
help to alter these parameters. It is recommended to increase the Window length
(`-w`) first before altering the _k_-gram length (`-k`).

### _k_-gram length

Short: `-k <integer>`, long: `--kgram-length <integer>`, default: `23`.

This changes the number of of _tokens_ contained in a single _k_-gram. This is the
minimum matchable unit: corresponding fragments in two files smaller than this
value will not be found.

Larger values decrease memory usage and decrease running time, but will result
in fewer detections.

### Window length

Short: `-w <integer>`, long: `--kgrams-in-window <integer>`, default: `17`.

This changes window length (in _k_-grams) used by the Winnowing algorithm. The
algorithm will pick one out of every `w` subsequent _k_-grams. This will
therefore reduce memory usage `w` times.

Larger values decrease memory usage and decrease running time, but will result
in fewer detections.

### Other parameters

Dolos includes other parameters that can be used to finetune the analysis. A
more detailed listing of these parameters and their function can be viewed by
running `dolos --help`.


## Output format

You can specify how Dolos reports its results by setting the `-f` or `--output-format` flag.
Formatting options are:
 - **terminal**: outputs plain text output in your terminal (default)
 - **web**: starts a webserver where you can interactively view results
 - **csv**: writes the resulting CSV-files of the analysis to a directory 

Often, you want to use the **web** option to use the interactive user interface
provided by Dolos:

```shell
dolos run -f web -l javascript *.js
```

This will start a local webserver where you can interactively explore the
analysis report in your browser. By default, the report is available on <http://localhost:3000>.

The report should look like [this](https://dolos.ugent.be/demo/sample/).

## Serving generated reports

If you run Dolos with `-f web` or `-f csv`, it will create a directory with the
analysis report in your current working directory.

You can view the results again in your browser without having to re-analyze the
files by executing the command
```shell
dolos serve dolos-report-20210831T141228596Z/
```

This will launch the same web view as if you launched Dolos with the `-f web`
option.
