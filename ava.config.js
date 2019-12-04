export default {
  files: [
    "src/test/**.ts"
  ],
  sources: [
    "src/**/*.ts",
    "!src/test/*"
  ],
  compileEnhancements: false,
  extensions: [
    "ts"
  ],
  require: [
    "ts-node/register"
  ]
};
