// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
  publicPath: "./",
  transpileDependencies: ["vuetify"],
  configureWebpack: (config) => {
    // Webpack resolve paths of dependencies.
    config.resolve = {
      fallback: {
        path: false,
        fs: false,
        os: false,
        child_process: false,
        assert: require.resolve("assert/"),
      },
      ...config.resolve
    };

    // Webpack plugins.
    config.plugins.push(...[
      // explicitly makes sure that tree sitter is not loaded
      // as it does not work in browser environments
      new webpack.IgnorePlugin({
        resourceRegExp: /tree-sitter/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /codeTokenizer/,
        contextRegExp: /library/,
      }),
      new MonacoWebpackPlugin()
    ]);
  },
};
