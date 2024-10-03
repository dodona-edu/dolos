---
outline: [2,3]
---

<script setup>
import { computed } from 'vue';
import { useStorage } from '@vueuse/core';

const defaultURL = "https://dolos.ugent.be/api";
const localhostURL = "http://localhost:3000";
const dolosURL = useStorage("dolos-docs-api-url", "https://dolos.ugent.be/api");

const isDefault = computed(() => dolosURL.value === defaultURL);

function setLocalhost() {
   dolosURL.value = localhostURL;
}

function setPublicAPI() {
   dolosURL.value = defaultURL;
}

</script>
<style>
.url-input {
	padding: 6px 12px;
	font-size: inherit;
	width: 100%;
	line-height: inherit;
	color: inherit;
	border: 1px solid var(--vp-c-divider);
	border-radius: 4px;
	display: flex;
	align-items: center;
	cursor: text;
}

.button-row button {
   background-color: var(--vp-button-alt-bg);
   color: var(--vp-button-alt-text);
   border-radius: 20px;
   padding: 0 20px;
   margin: 0 5px;
   line-height: 38px;
   font-size: 14px;
   display: inline-block;
   text-align: center;
   font-weight: 600;
   white-space: nowrap;
   transition: colos 0.25s, border-color 0.25s, background-color 0.25s;
}

.button-row button.primary {
   color: var(--vp-button-brand-text);
   background-color: var(--vp-button-brand-bg);
}
</style>

# Dolos API

Dolos provides its JSON API for automated integration with exercise platforms such as [Dodona](https://dodona.be).

<div v-if="isDefault">
   The description below shows the URL endpoints of our publicly hosted instance (<a href="https://dolos.ugent.be/server">dolos.ugent.be/api</a>).
</div>
<div v-else>
   The description below shows the URL endpoints of your custom URL endpoint. Click one of the buttons to change this back to the public endpoint.
</div>

Edit the value below to change the endpoint URL used in this documentation:

<input class="url-input" v-model="dolosURL"></input>

<div class="button-row">
<button :class="isDefault || 'primary'" @click="setPublicAPI">Use public API</button>
<button @click="setLocalhost">Use localhost API</button>
</div>

The API currently requires **no authentication**.

## Quick Start

If you only want to programmatically submit your files to analyze, you can use these code snippets.
You can access the visualisations using the `html_url` returned by the API.

::: code-group

```shell-vue [Shell]
# Requires curl and jq
# Outputs the URL to the resulting report
curl --request POST \
    --form "dataset[name]=Example" \
    --form "dataset[zipfile]=@simple-dataset.zip" \
    {{ dolosURL }}/reports \
    | jq -r '.html_url'
 ```

```html-vue [HTML / Javascript]
<form id="dolos-upload" action="{{ dolosURL }}/reports" >
   <input type="text" name="dataset[name]" placeholder="Name" />
   <input type="file" name="dataset[zifile]" />
   <input type="submit" value="Submit" />
</form>
<script type="text/javascript">
   document.getElementById("dolos-upload").addEventListener('submit', (event) => {
      event.preventDefault();
      fetch(event.target.action, {
         method: 'POST',
         body: new FormData(event.target)
      }).then(r => r.json()
      ).then(json => {
         // Go to the report URL
         window.location = json["html_url"];
      });
      return false;
   });
</script>
```

```python-vue [Python]
import requests # pip install requests

def submit_to_dolos(name, zipfile_path):
   """
   Submit a ZIP-file to the Dolos API for plagiarism detection
   and return the URL where the resulting HTML report can be found.
   """
   response = requests.post(
      '{{ dolosURL }}/reports',
      files = { 'dataset[zipfile]': open(zipfile_path, 'rb') },
      data = { 'dataset[name]': name }
   )
   json = response.json()
   return json["html_url"]
```

```ruby-vue [Ruby]
require 'httparty' # bundle install httparty

# Submit a ZIP-file to the Dolos API for plagiarism detection
# and return the URL where the resulting HTML report can be found.
def submit_to_dolos(name, zipfile_path)
   response = HTTParty.post(
     '{{ dolosURL }}/reports',
     body: {
       dataset: {
         name: name,
         zipfile: File.open(zipfile_path)
       }
     }
   )
   return response['html_url']
end
```

:::

## Object representations

A [dataset](#dataset-object) represents a ZIP-file with the submissions to be analysed.

A [report](#report-object) represents the resulting report of the analysis.

The resulting **report files** (`metadata.csv`, `files.csv`, `kgrams.csv` and `pairs.csv`) are available on report [data path](#getting-report-data).

### Report object

| Fields     | Type                     | Description                                                                                                                                      |
|------------|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| created_at | `string` (ISO timestamp) | Time at which the report was created.                                                                                                            |
| updated_at | `string` (ISO timestamp) | Time at which the report was last updated.                                                                                                       |
| url        | `string` (URL)           | URL at which information about this report can be accessed.                                                                                      |
| id         | `string`                 | Unique identifier of this report. This should remain secret, as this is the only information needed to access the report and download its files. |
| error      | `string` or `null`       | If the report status is `error`, a description of the cause of the error, else `null`.                                                           
| status     | `string` (enum)          | Current status of the repor. See [status enum](#status-enum) for possible values and their meaning.                                              |
| stderr     | `string`                 | Standard error output of the Dolos API. Contains warnings or informaiton about failures.                                                         |
| stdout     | `string`                 | Standard output of the Dolos CLI.                                                                                                                
| name       | `string`                 | Name of the analysed dataset.                                                                                                                    |
| html_url   | `string` (URL)           | URL of the HTML representation of the report.                                                                                                    |
| dataset    | Dataset object           | Dataset containing the submissions analysed in this report. See [dataset object](#dataset-object).                                               |

### Status enum

| Enum     | Description                                                                                                                   |  
|----------|-------------------------------------------------------------------------------------------------------------------------------|
| unknown  | The status of this report is not known (rare)                                                                                 |
| queued   | The report is waiting for the analysis to start.                                                                              |
| running  | The report is curently being analysed.                                                                                        |
| failed   | Dolos CLI returned a non-zero exit code, indicating that the analysis failed. Check the report `stderr` for more information. |
| error    | An internal error prevented the server from running the analysis. Check `error` for more information.                         |
| finished | The report is analysed and files are ready.                                                                                   |
| purged   | The report files are deleted and no longer available.                                                                         |

### Dataset object

| Fields               | Type                     | Description                                                                                                                                          |
|----------------------|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| created_at           | `string` (ISO timestamp) | Time at which the dataset was created.                                                                                                               |
| updated_at           | `string` (ISO timestamp) | Time at which the report was last updated.                                                                                                           |
| url                  | `string` (URL)           | URL at which information about this dataset can be accessed.                                                                                         |
| id                   | `string`                 | Unique identifier of this dataset. This should remain secret, as this is the only information needed to download its files.                          |
| programming_language | `string`                 | If given, name of the programming language of the submissions of this dataset. This is an **empty string** if automatic languagge detection is used. | 
| zipfile              | `string` (URL)           | URL from which the dataset ZIP-file can be downloaded.                                                                                               |
| name                 | `string`                 | Name of this dataset. Defaults to the name of the zipfile name without extension.                                                                    |

### Example JSON

```json-vue
{
  "created_at": "2024-03-11T14:11:19.142Z",
  "updated_at": "2024-03-11T14:11:27.666Z",
  "url": "{{ dolosURL }}/reports/9876543210123456789",
  "id": "9876543210123456789",
  "error": null,
  "status": "finished",
  "stderr": "",
  "stdout": "Writing results to directory: result\nMetadata written.\nPairs written.\nKgrams written.\nFiles written.\nCompleted\n",
  "name": "Example",
  "html_url": "https://dolos.ugent.be/server#/share/9876543210123456789",
  "dataset": {
    "created_at": "2024-03-11T14:11:19.136Z",
    "updated_at": "2024-03-11T14:11:19.141Z",
    "url": "{{ dolosURL }}/datasets/1234567891234567890",
    "id": "1234567891234567890",
    "programming_language": "",
    "zipfile": "{{ dolosURL }}/rails/active_storage/blobs/redirect/<...>/example.zip",
    "name": "Example"
  }
}
```
## API Endpoints

### Creating a report

To submit a ZIP-file for analysis, you need to send a `multipart/form-data` with the file.

#### Request

`POST {{ dolosURL }}/reports`

| Parameters                    | Type   | Required | Description                                                               |
|-------------------------------|--------|----------|---------------------------------------------------------------------------|
| dataset[zipfile]              | file   | **yes**  | `multipart/form-data` ZIP-file containing submissions to analyze.         | 
| dataset[name]                 | string | no       | Name of the dataset. Defaults to the zipfile name without file extension. |
| dataset[programming_language] | string | no       |

::: warning

ZIP-file submissions are limited to **10 MB** maximum file size.

For larger submissions, we recommend using the [Dolos CLI](/docs/installation) or [Dolos lib](/docs/library).

:::

#### Response

In case the required parameters are present and all parameters are valid, the API will respond with status code `201 Created` with a [report object](#report-object) as response body.

If you want to view the results, you can immediately redirect the user to the `html_url` in the report object.

If you need the report files, you will need to poll the report `url` periodically (see [getting report info](#getting-report-info)) until the status is settled. We recommend **polling once per second** for a **maximum of one minute**.
If the report status stays on `queued` or `running` for more than one minute, something is wrong with the server.

The report status will evolve as follows:

1. `queued`, waiting for the analysis to start
2. `running`, the analysis is running
3. It will then settle on one of these three states:
    - `finished` if the analysis completed successfully
    - `failed` if the analysis failed, usually due to a fault with the submission files
    - `error` if an error occured while analyzing the files

Once the status is `finished` you can [retrieve the report data](#getting-report-data).

###  Getting report info

To retrieve the report status and information, simply supply the report ID.
If you need the resulting files

#### Request

`GET {{ dolosURL }}/reports/:id`

#### Response

If a report with the corresponding id exists, the API will return a status `200 OK` with the [report object](#report-object) as body.

### Getting report data

#### Request

`GET {{ dolosURL }}/reports/:id/data/:file`

Where `:file` is one of:
- `metadata`: report metadata (such as detected programming language)
- `files`: submission file data
- `kgrams`: detailed information about matching kgrams 
- `pairs`: similarity metrics for each file pair

#### Response

If the corresponding file is attached to this report, the API will respond with a status code `302 Found` redirecting to the report file location.

### Deleting a report

Delete the report and corresponding dataset files.
A report object will still be preserved with status set to `purged`.

#### Request

`DELETE {{ dolosURL }}/reports/:id`

#### Response

If deleting the report and the dataset files succeeded, the API will respond with status code `204 No content` and an empty body.
