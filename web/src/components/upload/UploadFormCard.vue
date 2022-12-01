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
                    The dataset
                    and the resulting report will be deleted after 30 days.
                  </p>
                  <v-checkbox
                      v-model="accept"
                      :rules="acceptRules"
                      label="I accept the above conditions."
                      outlined>

                  </v-checkbox>
                </v-col>
              </v-row>
            </v-form>
            <div class="d-flex">
              <v-spacer />
              <v-btn color="primary" depressed :disabled="!valid" @click="onSubmit">
                Analyze
                <v-icon right>mdi-folder-search-outline</v-icon>
              </v-btn>
            </div>

          </v-stepper-content>

          <v-stepper-content step="2">
            <span>Uploading file...</span>

            <v-progress-linear
                class="mt-2"
                v-model="uploadProgress"
                height="25"
            >
              <strong>{{ uploadProgress }}%</strong>
            </v-progress-linear>

            <div class="d-flex">
              <v-spacer />
              <v-btn color="error" text depressed @click="handleCancel">
                Cancel analysis
                <v-icon right>mdi-close</v-icon>
              </v-btn>
            </div>
          </v-stepper-content>
        </v-stepper-items>

        <v-stepper-content step="3">
          <span v-if="reportStatus === 'queued'">Waiting for analysis to start...</span>
          <span v-if="reportStatus === 'running'">Running analysis...</span>
          <v-progress-linear
              :color="reportStatus === 'queued' ? 'warning' : 'primary'"
              :stream="reportStatus === 'queued'"
              :buffer-value="reportStatus === 'queued' ? 0 : undefined"
              :value="reportStatus === 'queued' ? 0 : undefined"
              :indeterminate="reportStatus === 'running'"
              class="mt-2"
              height="25"
          />

          <div class="d-flex">
            <v-spacer />
            <v-btn color="error" text depressed @click="handleCancel">
              Cancel analysis
              <v-icon right>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-stepper-content>
        <v-stepper-content step="4">

          <div class="d-flex">
            <v-alert
                type="success"
                border="left"
                class="flex-grow-1"
                text>
              Your dataset has been analysed.
            </v-alert>
            <v-alert type="info">
              <b>Note</b> that anyone with the link to the results will be able
              to view them. The dataset and the resulting report will be deleted
              after 30 days.
            </v-alert>
            <v-spacer />
            <v-btn color="success" primary :to="reportRoute">
              View results
              <v-icon right>mdi-arrow-right</v-icon>
            </v-btn>
          </div>
        </v-stepper-content>
      </v-stepper>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { shallowRef, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "@/composables";
import { default as axios } from "axios";

const router = useRouter();


const pollInterval = 1000;
const maxPolls = 60;

// Step in the analysis process.
const step = shallowRef(1);

// If the upload form is valid.
const valid = shallowRef(false);
// Error message, in case of an error.
const error = shallowRef();

// Selected file.
const file = shallowRef<File>();
const fileRules = [
  (v: File) => !!v || "File is required"
];

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
  (v: boolean) => v || "Please accept the conditions if you want to continue."
];

// Upload progress
const uploadProgress = shallowRef(25);
// Analysis status URL.
const reportStatusURL = shallowRef<string>();
// Analysis status.
const reportStatus = shallowRef<"queued" | "running" | "failed" | "error" | "finished">("queued");
// Analysis result URL.
const reportID = shallowRef<string>();

const reportRoute = computed(() => {
  if (reportID.value) {
    return {
      name: "Overview",
      params: {
        reportId: reportID.value,
      },
    };
  } else {
    return null;
  }
});

// Clear the form.
const clearForm = (): void => {
  file.value = undefined;
  name.value = "";
  language.value = null;
};

// Cancel the analysis.
const handleCancel = (): void => {
  step.value = 1;
  reportStatusURL.value = undefined;
  reportStatus.value = "queued";
  stopPolling();
};

// Handle an error.
const handleError = (message: string): void => {
  error.value = message;
  step.value = 1;
  reportStatusURL.value = undefined;
  reportStatus.value = "queued";
  stopPolling();
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
      const response = await axios.post(`${process.env.VUE_APP_API_URL}/reports`, data, {
        onUploadProgress: (e) => {
          uploadProgress.value = Math.ceil((e.loaded / e.total) * 100);

          // Go to the next step when the upload is complete.
          if (e.loaded === e.total) {
            step.value = 3;
          }
        }
      });

      // Get the analysis status URL.
      reportStatusURL.value = response.data["url"];
      reportID.value = response.data["id"].toString();

      // Make sure a status url was provided.
      if (!reportStatusURL.value) {
        handleError("No analysis URL was provided by the API.");
      }

      startPolling();
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

// Poll for the analysis results every 5 seconds.
const interval = shallowRef();

const startPolling = (): void => {
  if (interval.value) {
    stopPolling();
  }
  let pollsSinceUpdate = 0;
  interval.value = setInterval(async () => {
    // Do not poll when no analysis is running
    if (!reportStatusURL.value || (reportStatus.value != "queued" && reportStatus.value != "running")) {
      stopPolling();
      return;
    }

    console.log("Poll " + pollsSinceUpdate + " of " + maxPolls);

    try {
      const response = await axios.get(reportStatusURL.value);

      if (response.data.status !== reportStatus.value) {
        pollsSinceUpdate = 0;
        reportStatus.value = response.data.status;
      }

      if (response.data.status === "error" || response.data.status === "failed") {
        handleError(response.data.error);
      }

      if (pollsSinceUpdate >= maxPolls) {
        handleError("The analysis took too long to complete.");
      }

      if (response.data.status === "finished") {
        // Go to the results page.
        step.value = 4;
        stopPolling();
        // Clear the form.
        clearForm();
      }

    } catch (e: any) {
      // If the error cause was on the serve side,
      // cancel the analysis.
      if (e.response) {
        handleError(e.message);
      }
    } finally {
      pollsSinceUpdate += 1;
    }
  }, pollInterval);
};

const stopPolling = (): void => {
  if (interval.value) {
    clearInterval(interval.value);
  }
  interval.value = undefined;
};

onMounted(() => {
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});

</script>

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
