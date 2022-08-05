module.exports = {
  files: [
    "src/test/**.ts"
  ],
  extensions: [
    "ts"
  ],
  require: [
    "ts-node/register"
  ],
  workerThreads: false,
  verbose: "GITHUB_ACTIONS" in process.env,
  serial: "GITHUB_ACTIONS" in process.env
};
