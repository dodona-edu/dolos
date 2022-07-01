// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");

module.exports = {
  publicPath: "./",
  transpileDependencies: ["vuetify"],
  // explicitly makes sure that tree sitter is not loaded as it does not work in browser environments
  configureWebpack: {
    plugins: [
      new webpack.IgnorePlugin({
        resourceRegExp: /tree-sitter/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /codeTokenizer/,
        contextRegExp: /library/,
      }),
    ],
  },
};
