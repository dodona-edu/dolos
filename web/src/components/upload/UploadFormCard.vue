<script lang="ts" setup>
import { shallowRef, computed, watch } from "vue";
import { useReportsStore } from "@/stores";

const reports = useReportsStore();

// Step in the analysis process.
const step = shallowRef(1);

// If the upload form is valid.
const valid = shallowRef(false);
// Error message, in case of an error.
const error = shallowRef();
const stderr = shallowRef();

// Selected file.
const file = shallowRef<File>();
const filesRules = [(v: File) => !!v || "File is required"];

// Selected file name.
const name = shallowRef<string>();
const nameRules = [(v: string) => !!v || "Name is required"];

// Update the file name when the file changes.
watch(file, (file) => {
  if (file) {
    if (!file) return;

    name.value = file.name;
    name.value = name.value.replace(/\.[^/.]+$/, ""); // strip extension
  } else {
    name.value = "";
  }
});

// Selected language.
const language = shallowRef<string | null>(null);

// List with available programming languages.
const languages = [
  {
    name: "Automatic",
    value: null,
  },
  {
    name: "Bash",
    value: "bash",
  },
  {
    name: "C",
    value: "c",
  },
  {
    name: "C++",
    value: "cpp",
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
    name: "Go",
    value: "go",
  },
  {
    name: "Groovy",
    value: "groovy",
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
    name: "Modelica",
    value: "modelica"
  },
  {
    name: "OCaml",
    value: "ocaml"
  },
  {
    name: "PHP",
    value: "php"
  },
  {
    name: "Python",
    value: "python",
  },
  {
    name: "R",
    value: "r"
  },
  {
    name: "Rust",
    value: "rust"
  },
  {
    name: "Scala",
    value: "scala"
  },
  {
    name: "SQL",
    value: "sql"
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
  {
    name: "Verilog",
    value: "verilog"
  }
];

const accept = shallowRef<boolean>(false);
const acceptRules = [
  (v: boolean) => v || "Please accept the conditions if you want to continue.",
];

// Upload progress
const uploadProgress = shallowRef(25);

// Report
const reportActiveId = shallowRef<string | undefined>();
const reportActive = computed(() => {
  if (reportActiveId.value) {
    return reports.getReportById(reportActiveId.value);
  } else {
    return undefined;
  }
});
const reportRoute = computed(() => {
  if (reportActiveId.value) {
    return reports.getReportRouteById(reportActiveId.value);
  } else {
    return undefined;
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

    // Go to the next step.
    step.value = 2;

    // Upload the file.
    try {
      const report = await reports.uploadReport(name.value ?? file.value!.name, file.value!, language.value ?? "");

      // Set the report as active.
      reportActiveId.value = report.id;
      step.value = 3;
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


// If the submitted report is ready, show the result page
watch(
  () => reportActive.value,
  (report) => {
    if (report?.hasFinalStatus()) {
      if (report.status === "finished") {
        // Go to the results page.
        step.value = 4;
        // Clear the form.
        clearForm();
      }

      if (report.status === "failed" || report.status === "error") {
        stderr.value = report.stderr;
        handleError(`An error occurred while analyzing the dataset (${report.error})`);
      }
    }
  },
  {
    deep: true,
  }
);

</script>

<template>
  <v-card>
    <v-card-title>Analyze a dataset.</v-card-title>
    <v-card-subtitle>Upload a dataset to analyze.</v-card-subtitle>

    <v-card-text>
      <v-alert class="mb-2" type="info" variant="tonal" closable>
        Datasets and reports older than 30 days may be deleted from our server
        to save space. You can always delete the data yourself.
      </v-alert>

      <v-window class="upload-stepper" v-model="step">
        <v-window-item :value="1">
          <div v-if="error">
          <v-alert v-if="error" class="mb-4" variant="tonal" type="error" density="compact">
            {{ error }}
          </v-alert>
          <v-textarea v-if="stderr" readonly :rows="Math.min(15, stderr?.split('\n').length)" :model-value="stderr" />

          </div>

          <v-form v-model="valid" class="mt-2" fast-fail @submit="onSubmit">
            <v-file-input
              v-model="file"
              :rules="filesRules"
              :truncate-length="80"
              :show-size="1000"
              persistent-hint
              prepend-icon=""
              prepend-inner-icon="$file"
              accept="zip, application/zip"
              label="Upload a file (*.zip)"
              variant="outlined"
              density="compact"
            />

            <v-text-field
              class="mt-4"
              v-model="name"
              :rules="nameRules"
              label="Analysis name"
              variant="outlined"
              density="compact"
              hide-details
            />

            <v-autocomplete
              class="mt-4"
              v-model="language"
              :items="languages"
              label="Programming language"
              item-title="name"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
            />

            <p class="mt-4">
              When you upload a dataset, it will be analyzed on our server.
              Only you and the people you share the report with will be able
              to view the analysis results.
            </p>
            <v-checkbox
              v-model="accept"
              :rules="acceptRules"
              label="I accept the above conditions."
              color="primary"
            />
          </v-form>

          <v-card-actions class="pa-0">
            <v-spacer />

            <v-btn
              color="primary"
              elevation="0"
              :disabled="!valid"
              @click="onSubmit"
            >
              Analyze
              <v-icon end>mdi-folder-search-outline</v-icon>
            </v-btn>
          </v-card-actions>
        </v-window-item>

        <v-window-item :value="2">
          <span>Uploading file...</span>

          <v-progress-linear indeterminate reverse class="mt-2" color="primary" height="25" />

          <v-card-actions class="mt-4 pa-0">
            <v-spacer />

            <v-btn color="error" elevation="0" @click="handleCancel">
              Cancel analysis
              <v-icon end>mdi-close</v-icon>
            </v-btn>
          </v-card-actions>
        </v-window-item>

        <v-window-item :value="3">
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
            :model-value="reportActive?.status === 'queued' ? 0 : undefined"
            :indeterminate="reportActive?.status === 'running'"
            class="mt-2"
            height="25"
          />

          <v-card-actions class="mt-4 pa-0">
            <v-spacer />

            <v-btn
              color="error"
              variant="text"
              elevation="0"
              @click="handleCancel"
            >
              Cancel analysis
              <v-icon end>mdi-close</v-icon>
            </v-btn>
          </v-card-actions>
        </v-window-item>

        <v-window-item :value="4">
          <v-alert
            type="success"
            border="start"
            class="flex-grow-1"
            variant="tonal"
          >
            Your dataset has been analysed.
          </v-alert>

          <v-card-actions class="mt-4 pa-0">
            <v-spacer />

            <v-btn color="primary" variant="text" @click="handleReset">
              Analyze another dataset
              <v-icon end>mdi-reload</v-icon>
            </v-btn>

            <v-btn color="success" elevation="0" :to="reportRoute">
              View results
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-window-item>
      </v-window>
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
