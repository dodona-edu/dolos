export default {
  typescript: {
    rewritePaths: {
        "src/": "dist/"
    },
    compile: false,
  },
  files: [
    "src/test/**.ts"
  ],
  workerThreads: false
};
