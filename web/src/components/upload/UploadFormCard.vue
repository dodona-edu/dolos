<script lang="ts" setup>
import { shallowRef, ref, computed, watch } from "vue";
import { default as axios } from "axios";
import { useReportsStore } from "@/stores";

const reports = useReportsStore();

// Step in the analysis process.
const step = shallowRef(1);

// If the upload form is valid.
const valid = shallowRef(false);
// Error message, in case of an error.
const error = shallowRef();

// Selected file.
const file = shallowRef<File>();
const fileRules = [(v: File) => !!v || "File is required"];

// Selected file name.
const name = shallowRef<string>();
const nameRules = [];

// Update the file name when the file changes.
watch(file, (file) => {
  if (file) {
    name.value = file.name;
    // Strip the extension.
    name.value = name.value.replace(/\.[^/.]+$/, "");
  } else {
    name.value = "";
  }
});

// Selected language.
const language = shallowRef<string | null>(null);
const languageRules = [];

// List with available programming languages.
const languages = [
  {
    name: "Automatic",
    value: null,
  },
  {
    divider: true,
  },
  {
    name: "Bash",
    value: "bash",
  },
  {
    name: "C/C++",
    value: "c",
  },
  {
    name: "C#",
    value: "c-sharp",
  },
  {
    name: "Elm",
    value: "elm",
  },
  {
    name: "Java",
    value: "java",
  },
  {
    name: "JavaScript",
    value: "javascript",
  },
  {
    name: "Python",
    value: "python",
  },
  {
    name: "Text / Markdown",
    value: "char",
  },
  {
    name: "TypeScript",
    value: "typescript",
  },
  {
    name: "TSX",
    value: "tsx",
  },
];

const accept = shallowRef<boolean>(false);
const acceptRules = [
  (v: boolean) => v || "Please accept the conditions if you want to continue.",
];

// Upload progress
const uploadProgress = shallowRef(25);

// Report
const reportActiveId = shallowRef<string>();
const reportActive = computed(() =>
  reports.getReportById(reportActiveId.value)
);
const reportRoute = computed(() =>
  reports.getReportRouteById(reportActiveId.value)
);

// Clear the form.
const clearForm = (): void => {
  file.value = undefined;
  name.value = "";
  language.value = null;
};

// Cancel the analysis.
const handleCancel = (): void => {
  step.value = 1;
  reportActiveId.value = undefined;
};

// Handle reset.
const handleReset = (): void => {
  step.value = 1;
  reportActiveId.value = undefined;
  clearForm();
};

// Handle an error.
const handleError = (message: string): void => {
  step.value = 1;
  error.value = message;
};

// When the form is submitted.
const onSubmit = async (): Promise<void> => {
  // Make sure the form is valid.
  if (valid.value) {
    const data = new FormData();
    data.append("dataset[zipfile]", file.value ?? new Blob());
    data.append("dataset[name]", name.value ?? "");
    data.append("dataset[programming_language]", language.value ?? "");

    // Go to the next step.
    step.value = 2;

    // Upload the file.
    try {
      const response = await axios.post(
        `${process.env.VUE_APP_API_URL}/reports`,
        data,
        {
          onUploadProgress: (e) => {
            uploadProgress.value = Math.ceil((e.loaded / e.total) * 100);

            // Go to the next step when the upload is complete.
            if (e.loaded === e.total) {
              step.value = 3;
            }
          },
        }
      );

      // Create a new report.
      const report = {
        reportId: response.data["id"] as string,
        name: name.value ?? "",
        date: new Date().toISOString(),
        status: response.data["status"],
        statusUrl: response.data["url"],
        response: response.data,
      };

      // Add the report to the reports list in local storage.
      reports.addReport(report);

      // Set the report as active.
      reportActiveId.value = response.data["id"];

      // Make sure a status url was provided.
      if (!report.statusUrl) {
        handleError("No analysis URL was provided by the API.");
      }
    } catch (e: any) {
      if (e.code == "ERR_NETWORK") {
        handleError("Could not connect to the API.");
      } else {
        handleError("An error occurred while uploading the file: " + e.message);
      }
    } finally {
      uploadProgress.value = 0;
    }
  }
};

// Poll configuration
const pollingInterval = 1000;
const pollingMax = 60;

// List containing the the ids of the reports that are currently polling.
const pollingReports = ref<string[]>([]);

// Start polling for a specific report.
const startPolling = (reportId: string): void => {
  // Do not start polling when the report is already polling.
  if (pollingReports.value.includes(reportId)) {
    return;
  }

  // Create the interval for polling.
  const interval = setInterval(async () => {
    // Stop the interval when the report is not in the list of polling reports.
    if (!pollingReports.value.includes(reportId)) {
      clearInterval(interval);
      return;
    }

    // Get the report from the reports list.
    const report = reports.getReportById(reportId);

    // Stop the polling if the report no longer exists.
    if (!report) {
      clearInterval(interval);
      return;
    }

    try {
      const status = await reports.getReportStatus(report);

      // Update the report status.
      report.status = status.status;

      // Stop the polling when the report status is final.
      if (
        report.status === "finished" ||
        report.status === "error" ||
        report.status === "failed"
      ) {
        delete pollingReports[report.reportId];
        clearInterval(interval);
      }

      // If the report is the active report
      // apply some changes to the form UI.
      if (report === reportActive.value) {
        if (report.status === "finished") {
          // Go to the results page.
          step.value = 4;
          // Clear the form.
          clearForm();
        }

        if (report.status === "error" || report.status === "failed") {
          handleError(status.error);
        }
      }
    } catch (e: any) {
      //
    }
  }, pollingInterval);

  // Add the report.
  pollingReports.value.push(reportId);
};

// Start polling for any report in the list of reports
// of which the status is not final yet.
watch(
  () => reports.reports,
  (reports) => {
    for (const report of reports) {
      if (
        report.status !== "finished" &&
        report.status !== "error" &&
        report.status !== "failed"
      ) {
        startPolling(report.reportId);
      }
    }
  },
  {
    immediate: true,
  }
);
</script>

<template>
  <v-card>
    <v-card-title>Analyze a dataset.</v-card-title>
    <v-card-subtitle>Upload a dataset to analyze.</v-card-subtitle>

    <v-card-text>
      <v-stepper class="upload-stepper" v-model="step" flat>
        <v-stepper-items>
          <v-stepper-content step="1">
            <transition name="slide-y-transition">
              <v-alert v-if="error" text type="error">
                {{ error }}
              </v-alert>
            </transition>

            <v-form v-model="valid" class="pt-2" @submit="onSubmit">
              <v-row>
                <v-col cols="12">
                  <v-file-input
                    v-model="file"
                    :rules="fileRules"
                    :truncate-length="80"
                    :show-size="1000"
                    prepend-icon=""
                    prepend-inner-icon="$file"
                    accept="zip, application/zip"
                    label="Upload a file (*.zip)"
                    outlined
                    dense
                  />

                  <v-text-field
                    v-model="name"
                    :rules="nameRules"
                    label="File name"
                    outlined
                    dense
                  />

                  <v-autocomplete
                    v-model="language"
                    :rules="languageRules"
                    :items="languages"
                    label="Programming language"
                    item-text="name"
                    item-value="value"
                    outlined
                    dense
                  />
                </v-col>

                <v-col cols="12">
                  <p>
                    When you upload a dataset, it will be analyzed and you you
                    will be able to view the results with a secret link. Anyone
                    with the link to the results will be able to view them, do
                    not share the link with anyone you do not trust.
                  </p>
                  <p>
                    The dataset and the resulting report will be deleted after
                    30 days.
                  </p>
                  <v-checkbox
                    v-model="accept"
                    :rules="acceptRules"
                    label="I accept the above conditions."
                    outlined
                  >
                  </v-checkbox>
                </v-col>
              </v-row>
            </v-form>

            <v-card-actions class="pa-0">
              <v-spacer />
              <v-btn
                color="primary"
                depressed
                :disabled="!valid"
                @click="onSubmit"
              >
                Analyze
                <v-icon end>mdi-folder-search-outline</v-icon>
              </v-btn>
            </v-card-actions>
          </v-stepper-content>

          <v-stepper-content step="2">
            <v-alert type="info" text>
              <b>Note:</b> the dataset and the resulting report will be deleted
              after 30 days. Anyone with the resulting link will be able to view
              the results of the analysis.
            </v-alert>

            <span>Uploading file...</span>

            <v-progress-linear
              class="mt-2"
              v-model="uploadProgress"
              height="25"
            >
              <strong>{{ uploadProgress }}%</strong>
            </v-progress-linear>

            <v-card-actions class="mt-4 pa-0">
              <v-spacer />

              <v-btn color="error" depressed @click="handleCancel">
                Cancel analysis
                <v-icon end>mdi-close</v-icon>
              </v-btn>
            </v-card-actions>
          </v-stepper-content>
        </v-stepper-items>

        <v-stepper-content step="3">
          <v-alert type="info" text>
            <b>Note:</b> the dataset and the resulting report will be deleted
            after 30 days. Anyone with the resulting link will be able to view
            the results of the analysis.
          </v-alert>

          <span v-if="reportActive?.status === 'queued'">
            Waiting for analysis is to start...
          </span>

          <span v-if="reportActive?.status === 'running'">
            Running analysis...
          </span>

          <v-progress-linear
            :color="reportActive?.status === 'queued' ? 'warning' : 'primary'"
            :stream="reportActive?.status === 'queued'"
            :buffer-value="reportActive?.status === 'queued' ? 0 : undefined"
            :value="reportActive?.status === 'queued' ? 0 : undefined"
            :indeterminate="reportActive?.status === 'running'"
            class="mt-2"
            height="25"
          />

          <v-card-actions class="mt-4 pa-0">
            <v-spacer />

            <v-btn color="error" text depressed @click="handleCancel">
              Cancel analysis
              <v-icon end>mdi-close</v-icon>
            </v-btn>
          </v-card-actions>
        </v-stepper-content>

        <v-stepper-content step="4">
          <v-alert type="success" border="left" class="flex-grow-1" text>
            Your dataset has been analysed.
          </v-alert>

          <v-alert type="info" text>
            <b>Note:</b> the dataset and the resulting report will be deleted
            after 30 days. Anyone with the resulting link will be able to view
            the results of the analysis.
          </v-alert>

          <v-card-actions class="mt-4 pa-0">
            <v-spacer />

            <v-btn color="primary" primary text @click="handleReset">
              Analyze another dataset
              <v-icon end>mdi-reload</v-icon>
            </v-btn>

            <v-btn color="success" primary depressed :to="reportRoute">
              View results
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-stepper-content>
      </v-stepper>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.upload {
  &-stepper {
    :deep(.v-stepper__content) {
      padding: 0 !important;
    }
  }
}

.info-list {
  &-item {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }
}
</style>
