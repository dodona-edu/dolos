# Running Dolos

If you want to follow along, we have provided a [ZIP with sample files](/dolos-js-samples.zip).
Download and extract this in your terminal.

On Unix, you can accomplish this using the following commands:
```shell
wget https://dolos.ugent.be/dolos-js-samples.zip
unzip dolos-js-samples.zip
cd dolos-js-samples/
ls
# another_copied_function.js  copied_function.js  copy_of_sample.js  sample.js
```

## Simple start

The simplest way to run Dolos is to set the language using the `-l` or `--language`
flag and pass it a list of all the files you want to analyze:
```shell
dolos run -l javascript another_copied_function.js  copied_function.js  copy_of_sample.js  sample.js
# or shorter using file globbing
dolos run -l javascript *.js
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
