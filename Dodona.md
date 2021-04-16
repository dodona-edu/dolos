# Use case: Plagiarism detection for Dodona

A quick guide on how to perform plagiarism detection on a Dodona exercise.

First [follow the installation instructions](./cli/README.md#Installation) to
install Dolos on your system.

## Fetch submissions from Dodona

In Dodona, repeat the following steps for each exercise:

1. Click on the series menu the exercise is in and click "Export student submissions"
2. Only select the desired exercise and click _next_.
3. Select the following options:
    - Include a summary
    - Only the last submission
    - Group "By exercise"
    - Only students with at least one submission
4. Start export, wait until finished and download file.

Then, on your computer:

1. Create a directory for the current exercise
    ```
    mkdir {EXERCISE}
    ```
2. Unzip the export to this directory
    ```
    unzip ~/Downloads/{EXPORT NAME}.zip -d {EXERCISE}/ -O utf8
    ```

## Run Dolos plagiarism detection

In the CLI directory, run Dolos:

```
yarn dolos -m 10 -f web -l {LANG} -k 100 -w 100 /path/to/{EXERCISE}/info.csv
```

This will make an HTML page with an overview of the report available on [localhost:3000](http://localhost:3000). It will also create a `dolos-report-${date}/` directory with the analyzed files.

An overview of useful CLI options:
- `-h`: Show the help info with all the CLI options
- `-l`: Language of the exercise (java, javascript, python ...).
- `-f $FORMAT`: Select the output format. `web` will show a UI in your browser, `console` will show a summary on the command line.
- `-k`: kmer length, an internal parameter, make bigger if too slow
- `-w`: window size, an internal parameter, make bigger if too slow
- `-m $NUMBER`: if a match occurs in `$NUMBER` submissions, it is ignored. A good value is `-m 10`.
- `-s $NUMBER`: minimum block length (default 0). If there are too much false positives, you may increase this value.
- `-L $NUMBER`: limit the output to `$NUMBER` pairs.

## Dolos web

Once you've started the Dolos with the `-f web` flag, it will launch an interactive UI which you can visit with your browser at [localhost:3000](http://localhost:3000).

There are currently three types of visualizations:
- The **Summary** where you can see and search for each file pair, initially sorted by similarity. Clicking on a row will open the compare view:
- The **Compare** view comparing a pair of files, highlighting the matches discovered by Dolos. With the _blocks_ menu (top right) you can disable and filter these blocks.
- The **Graph** view (tree symbol in the top right corner) where nodes represent files which are linked when they are similar to other files. Only links above the similarity threshold are shown.
