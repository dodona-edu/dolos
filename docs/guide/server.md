# Using Dolos Online

We provide a free online service to run Dolos directly from your browser.
You can use this service at [dolos.ugent.be/server](https://dolos.ugent.be/server).

If you want to follow along, you can download a [ZIP with sample files](/simple-dataset.zip) which you can analyze on our server.

## Upload and analyze files

![Screenshot of the upload form](/images/screenshots/dolos-upload.png)

To start a plagiarism analysis, upload a ZIP-file containing the files you want to analyze.
You can specify a name for your analysis, which will be used to identify it in the report history.

Additionally, you can select the programming language of the files.
Dolos will automatically detect the language based on the file extension, but you can override this if needed.

Click "Analyze" to upload your files and start the analysis.


### Upload format

Currently, we only support uploading a single ZIP-file containing all the files you want to analyze with a required `info.csv` file.

::: info

This is the format in which [Dodona](./dodona.md) exports submissions. 
If you're exporting from Dodona, you don't need to do anything.

We plan to support more formats in the future.

:::

A column **filename** is required and should contain the path of the file relative to the root of the ZIP-file.

The following columns are optional, but will be used to improve the analysis:
- **labels** single label, submissions with the same label will have the same colour in the report.
- **created_at** with the timestamp of the submission, this will be used to construct a timeline of the submissions.

Additional columns will be ignored.

#### Example

An example of a valid `info.csv`:

::: code-group

```csv [Only required column]
filename
alice.js
bob.js
carol.js
zoe.js
```

```csv [With optional columns]
filename,labels,created_at
alice.js,teacher,2019-07-23 17:12:33 +0200
bob.js,,2019-07-25 11:02:57 +0200
carol.js,group1,2019-07-25 14:43:20 +0200
zoe.js,group1,2019-07-27 19:22:39 +0200
```
:::

### Analysis results

After submitting you dataset, Dolos will put your analysis in a queue.
When the analysis is complete, you will see the following screen:

![Notification if the analysis is complete](/images/screenshots/dolos-finished.png)

Clicking on the "View results" button will take you to the report page.

![Screenshot of the report page](/images/screenshots/dolos-report-overview.png)

::: tip Sharing reports

We keep the secret link hidden by default, so you don't accidentally share it with others.

To share the report, click the "Share" button in the top right corner and copy the secret link.

:::

## Report history

![Screenshot of the report history list](/images/screenshots/dolos-history.png)

On the right side of the upload form, you can find a list all your previous results.
The form will remember the results in the _local storage_ of your browser.
This means that the list will be cleared when you clear your browser data.

If you want to remember a report, or share it with someone else, you can click the "Share" button and copy the secret link.

If you want to delete the dataset and the analysis report from our servers, you can click the "Delete" button.

::: info

If you lose the secret link to a report (for example: by clearing your browser data), you will not be able to delete it.
However, there is no way to access the report without the secret link and we will periodically delete old reports from our servers.

You can simply upload the same dataset again to get a new report for the same dataset.

:::

## How is this free?

Dolos is developed and run by [Team Dodona](https://dodona.ugent.be/en/about/).
We are researchers and teachers of programming courses at Ghent University.

We will never sell the analyzed data or use it for commercial purposes.
At any point, you can delete your data from our servers.
We will periodically delete data to free up space on our servers.

Just as with our online exercise platform [Dodona](https://dodona.ugent.be), we provide this service for free for schools and universities.
Our servers are hosted by [Ghent University, Belgium](https://www.ugent.be/en).

You can also run Dolos locally or host your own server.
The source code of Dolos is open-source and available on Github: [github.com/dodona-edu/dolos/](https://github.com/dodona-edu/dolos/).

### Supported by

<div class="image-row">
<a href="https://www.ugent.be/en"><img src="/images/ugent.png" alt="Ghent University" /></a>
<a href="https://www.ugent.be/we/en"><img src="/images/we.png" alt="Ghent University Faculty of Sciences" /></a>
<a href="https://www.elixir-belgium.org/"><img src="/images/elixir.png" alt="ELIXIR Belgium" /></a>
</div>

Help us keep Dolos and Dodona free and [support us](https://dodona.ugent.be/en/support-us/).


