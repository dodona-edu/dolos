# Use Dolos

Dolos is a [web app](https://dolos.ugent.be/server) for plagiarism detection in source code that is free to use.

All you need is a browser.
No additional installations needed.
We describe the steps for plagiarism detection within a set of source files.
Download this [ZIP-file](/simple-dataset.zip) containing some sample files if you want to perform the analysis yourself.


## Upload and inspect source files

Start plagiarism detection by uploading a ZIP-file containing the source files you want to inspect.

![Screenshot of the upload form](/images/screenshots/dolos-upload.png)

Specify a name for the analysis or keep the default name.
This name allows you to identify results in the backlog of analysis results that is kept in your browser history.

Dolos automatically detects the programming language of the inspected source files based on their file extensions.
If the ZIP-file contains source files from a mix of programming languages, Dolos will only inspect the files from the dominant programming language.
Select a specific programming language if you want to override the automatic selection.

Read the terms and conditions and check "I accept the above conditions".

Click "Analyze" to upload your files and start the analysis.

::: tip

You can enhance the analysis results by [adding metadata](/docs/adding-metadata) to your submissions.

Submissions exported from [Dodona](/docs/dodona) with the option `Include info csv` enabled already include metadata in a format Dolos recognizes.

:::

### Analysis results

Dolos schedules an analysis for your submitted dataset.
The scheduler uses a queue to avoid overloading the server.
You get informed as soon as the analysis is completed:

![Notification if the analysis is complete](/images/screenshots/dolos-finished.png)

Click "View results" to start exploring the analysis results.

![Screenshot of the report page](/images/screenshots/dolos-report-overview.png)

::: tip Sharing reports

By default, the secret link to your analysis report is kept hidden, so you don't accidentally share it with others.

To share a report, click the "Share" button in the top right corner and copy the secret link.

:::

## Report history

To the right side of the upload form, you'll see a list of previous analysis results.
This list is stored in the _local storage_ of your browser, meaning that the list is removed whenever you clear your browser data.

![Screenshot of the report history list](/images/screenshots/dolos-history.png)

If you want to keep track of a report or share it with someone else, click the "Share" button and copy the secret link.

If you want to permanently delete a submitted dataset and its analysis report from our servers, click the "Delete" button.

::: info

If the secret link to a report gets lost (for example: by clearing your browser data), you can no longer delete the report from our servers yourself.
However, the secret link is the only way to get access to the report and we periodically delete old reports from our servers.

You can simply upload the same dataset again to generate a new report.

:::

## How is this free?

[Team Dodona](https://dodona.be/en/about/) develops Dolos and hosts a free web app instance.
We are researchers and teachers of programming courses at [Ghent University](https://www.ugent.be/en) (Belgium).

Team Dodona never shares submitted files or analysis reports with others and never uses it for commercial purposes.
You can delete your data from our servers at any point.
We periodically delete older data to free up space on our servers.

As with our [Dodona](https://dodona.be) platform for learning to code, we provide Dolos as a free service to schools and universities.
Our servers are hosted by [Ghent University](https://www.ugent.be/en) (Belgium).

You can also [run Dolos locally](installation.html) or [host your own server](docker.html).
The source code of Dolos is open and available on Github: [github.com/dodona-edu/dolos/](https://github.com/dodona-edu/dolos/).

### Supported by

<br>
<div class="image-row">
<a href="https://www.ugent.be/en"><img src="/images/ugent.png" alt="Ghent University" /></a>
<a href="https://www.ugent.be/we/en"><img src="/images/we.png" alt="Ghent University Faculty of Sciences" /></a>
<a href="https://www.elixir-belgium.org/"><img src="/images/elixir.png" alt="ELIXIR Belgium" /></a>
</div>

Help us keep Dolos and Dodona free and [support us](https://dodona.be/en/support-us/).

