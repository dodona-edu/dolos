<template>
  <div>
    <div class="hero">
      <h2 class="hero-title">DOLOS</h2>
      <div class="hero-subtitle text--secondary">
        Source code plagiarism detection
      </div>
    </div>

    <v-row>
      <v-col cols="12" sm="8" md="6">
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

                    <div class="d-flex">
                      <v-spacer />
                      <v-btn color="primary" depressed :disabled="!valid" @click="onSubmit">
                        Analyse
                        <v-icon right>mdi-folder-search-outline</v-icon>
                      </v-btn>
                    </div>
                  </v-form>
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
                  <v-spacer />
                  <v-btn color="success" text depressed :to="`/reports/${ reportID }/`">
                    View results
                    <v-icon color="success" right>mdi-check</v-icon>
                  </v-btn>
                </div>
              </v-stepper-content>
            </v-stepper>
          </v-card-text>
        </v-card>
      </v-col>

      <!--
      <v-col cols="12" md="6">
        <v-card>
          <v-row align="center" no-gutters>
            <v-col cols="12" md="6">
              <v-card-title>
                Previous analysis results
              </v-card-title>
              <v-card-subtitle>
                View the analysis results of previous uploads on this computer.
              </v-card-subtitle>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
                outlined
                dense
              />
            </v-col>
          </v-row>
          <uploads-table :uploads="[]" :search.sync="search" />
        </v-card>
      </v-col>
      -->
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "@/composables";
import axios from "axios";


const router = useRouter();

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
const language = shallowRef<string>(null);
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
    name: "Python",
    value: "python",
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
    name: "C",
    value: "c",
  },
];

// Upload progress
const uploadProgress = shallowRef(25);
// Analysis status URL.
const reportStatusURL = shallowRef<string>();
// Analysis status.
const reportStatus = shallowRef<"queued" | "running" | "failed" | "error" | "finished">("queued");
// Analysis result URL.
const reportID = shallowRef<string>();

// Clear the form.
const clearForm = (): void => {
  file.value = null;
  name.value = "";
  language.value = null;
};

// Cancel the analysis.
const handleCancel = (): void => {
  step.value = 1;
  reportStatusURL.value = null;
  reportStatus.value = "queued";
};

// Handle an error.
const handleError = (message: string): void => {
  error.value = message;
  step.value = 1;
  reportStatusURL.value = null;
  reportStatus.value = "queued";
};

const gotoReport = (): void => {
  // go to report
  router.push({ name: "report", params: { id: reportID.value } });
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
    } catch (e: any) {
      handleError(e.message);
    } finally {
      uploadProgress.value = 0;
    }
  }
};

// Poll for the analysis results every 5 seconds.
const interval = shallowRef();
onMounted(() => {
  interval.value = setInterval(async () => {
    // Do not poll when no analysis is running
    if (!reportStatusURL.value) return;

    try {
      const response = await axios.get(reportStatusURL.value);

      if (response.data.status === "running") {
        reportStatus.value = "running";
      }

      if (response.data.status === "error") {
        handleError(response.data.error);
      }

      if (response.data.status === "failed") {
        handleError(response.data.error);
      }

      if (response.data.status === "finished") {
        // Go to the results page.
        step.value = 4;
        // Clear the form.
        clearForm();
      }
    } catch (e) {
      // If the error cause was on the serve side,
      // cancel the analysis.
      if (e.response) {
        handleError(e.message);
      }
    }
  }, 1000);
});
onUnmounted(() => {
  clearInterval(interval.value);
});
</script>

<style lang="scss" scoped>
.hero {
  padding-bottom: 1rem;

  &-title {
    font-size: 2.5rem;
  }

  &-subtitle {
    font-size: 1.25rem;
  }
}

.upload {
  &-stepper {
    :deep(.v-stepper__content) {
      padding: 0 !important;
    }
  }
}
</style>
