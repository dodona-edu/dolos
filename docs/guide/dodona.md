# Use case: Dodona

To illustrate how Dolos can be used in education practice, we show how teachers can perform plagiarism detection on submissions exported from the coding platform [Dodona](https://dodona.ugent.be).

## Export submissions from Dodona

Export submissions for a programming exercise in a [Dodona](https://dodona.ugent.be) course:

1. In the series that contains the exercise, open the series menu and choose _Export student submissions_. ![Series menu showing "Export student submissions" as option](/images/dodona-export-0.png)
2. Select the exercise and click _Next step_. ![Export wizard showing a selection of exercises](/images/dodona-export-1.png)
3. Select the following options:
    - Include a summary
    - Only the last submission (default)
    - Only students with at least one submission
  ![Export wizard showing different options](/images/dodona-export-2.png)
4. Click _Start export_ and wait until exporting has finished
5. Download the export (ZIP-file).

::: tip
It is allowed to select multiple exercises from the same series (step 2). However, Dolos will cross-compare all exported submissions without making a distinction between submissions for the same exercise or for different exercises.
:::

## Detect plagiarism using Dolos Online

Open [Dolos Online](https://dolos.ugent.be/server) in your browser. Upload the ZIP-file you just downloaded from Dodona. Click _Analyze_.

Within a few seconds, the plagiarism detection report will be ready and you will be able to explore the results.

[Read more about how to use Dolos Online](/guide/server).

## Run Dolos CLI (offline)

[Installing Dolos CLI](/guide/installation) on your computer if you haven't done so. Run Dolos on the ZIP-file you just downloaded from Dodona: 

```shell
dolos run -f web -l ${LANGUAGE} dodona-exported.zip
```

A plagiarism detection report is made available on [localhost:3000](http://localhost:3000). Dolos has also created a `dolos-report-${date}/` directory containing the analysis results in plain text.

::: tip
Provide metadata on the submissions by passing an `info.csv` file to Dolos.
:::

The plagiarism detection analysis performed by Dolos can be tweaked by passing specific command line arguments. Run `dolos -h` to see a detailed list of all available arguments.

### Dolos UI

Running Dolos with the `-f web` flag, will open an interactive report in your browser at [localhost:3000](http://localhost:3000).
