# Use case: Dodona

This page serves as an illustration how to use Dolos in practice, by showing how
you can perform an analysis with Dolos on data exported from the online
programming exercise platform [Dodona](https://dodona.ugent.be).

## Fetch submissions from Dodona

In [Dodona](https://dodona.ugent.be), export the students' submissions:

1. Click on the series menu the exercise is in and click _Export student submissions_. ![Series menu showing "Export student submissions" as option](/images/dodona-export-0.png)
2. Select the desired exercise and click _Next step_. ![Export wizard showing a selection of exercises](/images/dodona-export-1.png)
3. Select the following options:
    - Include a summary
    - Only the last submission
    - Only students with at least one submission
    - (Optionally) Group "By exercise"
  ![Export wizard showing different options](/images/dodona-export-2.png)
4. Start export, wait until finished and download file.

::: tip
You can select multiple exercises in step 2 if the submissions are different enough that they will have less similarities. However, Dolos will still compare the submissions as if they were for a single exercise.
:::

## Run Dolos Online

Go to [dolos.ugent.be/server](https://dolos.ugent.be/server) and upload the ZIP-archive you just downloaded from Dodona and click "Analyze".

After a few seconds, the report will be ready and you will be able to explore the results.

[Read more about how to use Dolos Online](/guide/server).

## Run Dolos CLI (offline)

First, [installing Dolos CLI](/guide/installation), on your computer.

Next, can run Dolos directly on the ZIP-archive:

```shell
dolos run -f web -l ${LANGUAGE} dodona-exported.zip
```

This will make an HTML page with an overview of the report available on [localhost:3000](http://localhost:3000). It will also create a `dolos-report-${date}/` directory with the analyzed files.

::: tip
By passing the `info.csv` file, Dolos can include the metadata associated with
the submissions in the resulting report. 
:::

You can change how Dolos performs the analysis by passing different command-line
arguments. You can view a list of arguments by running `dolos -h`.

### Dolos UI

Once you've started the Dolos with the `-f web` flag, it will launch an interactive UI which you can visit with your browser at [localhost:3000](http://localhost:3000).

