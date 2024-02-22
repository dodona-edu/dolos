# Adding metadata

You can improve the report by adding metadata together with your submissions:

- Adding a submission timestamp will enable the **submission timeline**.
- Adding a **label** to submissions will add a distinctly coloured label to the submissions show in the report. This is useful when you have multiple cohorts in a course.
- Adding a **full_name** will show the name of the submission author instead of the file name.

Metadata does not alter how the plagiarism detection pipeline works.
It only has effect on the visualizations in the resulting report.

::: info

If you export submissions from [Dodona](./dodona.md) with the option "Include info csv" enabled, you download a ZIP-file that already has the expected metadata format for Dolos.

:::

## CSV format

To submit metadata, you need to include a <abbr title="Comma Separated Values">CSV</abbr> file with this data in a structured format.
The format is the same for the Dolos web app, the Dolos CLI and the Dolos javascript library.

The `info.csv` file must have a column `filename` that contains the paths of all inspected source files relative to the root of the ZIP-file.

These columns are optional, but will be used to improve the analysis:

- `label`: a string label; the analysis report will use the same color for submissions with the same label (using the column name `labels` will also work, however only a single label is supported)
- `created_at`: a timestamp of the submission; timestamps are used to construct a timeline of submissions
- `full_name`: a string with the full name of the submission author (student)

Additional columns are allowed, but will be ignored by Dolos.

#### Example

Here's an example of a valid `info.csv` file:

::: code-group

```csv [Required column only]
filename
alice.js
bob.js
carol.js
zoe.js
```

```csv [With optional columns]
filename,label,created_at
alice.js,teacher,2019-07-23 17:12:33 +0200
bob.js,,2019-07-25 11:02:57 +0200
carol.js,group1,2019-07-25 14:43:20 +0200
zoe.js,group1,2019-07-27 19:22:39 +0200
```
:::

## Using the Dolos web app

Include the `info.csv` file in the **root** of the ZIP-file (not in a directory).

::: tip
If you export submissions from [Dodona](./dodona.md), you download a ZIP-file that has the expected format for Dolos.
Learn more about how you can analyse Dodona submissions with Dolos from the [Dodona use case](./dodona.html).
:::


## Using Dolos CLI

If you're using a **ZIP** file with the submissions, add the `info.csv` to the root of the ZIP-file (not in a directory).

With the files on your filesystem, you can point Dolos directly to the `info.csv` file:

```shell
dolos run -l javascript info.csv
```

