# Use case: Dodona

This page serves as an illustration how to use Dolos in practice, by showing how
you can perform an analysis with Dolos on data exported from the online
programming exercise platform [Dodona](https://dodona.ugent.be).

## Fetch submissions from Dodona

In [Dodona](https://dodona.ugent.be), export the students' submissions:

1. Click on the series menu the exercise is in and click "Export student submissions"
2. Select the desired exercises and click _next_.
3. Select the following options:
    - Include a summary
    - Only the last submission
    - Only students with at least one submission
    - (Optionally) Group "By exercise"
4. Start export, wait until finished and download file.

::: tip
We will here analyze submissions of the different exercises together, because we
assume the exercises are different enough such that they will have little
similarities.

If you prefer to analyze each exercise separately, you can select only one
exercise in step 2 and repeat this process for each exercise.
:::

Then, on your computer:

1. Create a directory for the current analysis
    ```shell
    mkdir dodona-analysis
    ```
2. Unzip the export to this directory
    ```shell
    unzip ~/Downloads/${EXPORT NAME}.zip -d dodona-analysis/ -O utf8
    ```

## Run Dolos plagiarism detection

Run Dolos on the extracted files:

```shell
dolos -f web -l ${LANGUAGE} dodona-analysis/info.csv
```

This will make an HTML page with an overview of the report available on [localhost:3000](http://localhost:3000). It will also create a `dolos-report-${date}/` directory with the analyzed files.

::: tip
By passing the `info.csv` file, Dolos can include the metadata associated with
the submissions in the resulting report. 
:::

You can change how Dolos performs the analysis by passing different commandline
arguments. You can view a list of arguments by running `dolos -h`.

## Dolos web

Once you've started the Dolos with the `-f web` flag, it will launch an interactive UI which you can visit with your browser at [localhost:3000](http://localhost:3000).

There are currently three types of visualizations:
- The **File pairs** list where you can see and search for each file pair, initially sorted by similarity. Clicking on a row will open the compare view:
- The **Compare** view comparing a pair of files, highlighting the matches discovered by Dolos. With the _fragments_ menu (top right) you can disable and filter these fragments.
- The **Graph** view (in the navigation drawer on the left) where nodes represent files which are linked when they are similar to other files. Only links above the similarity threshold are shown.
