// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");

module.exports = {
  publicPath: "./",
  transpileDependencies: ["vuetify"],
  chainWebpack: (config) => {
    config.module
      .rule("ts")
      .use("ts-loader")
      .tap((options) => {
        options.compiler = "ttypescript";
        return options;
      });

    config.module
      .rule("tsx")
      .use("ts-loader")
      .tap((options) => {
        options.compiler = "ttypescript";
        return options;
      });
  },
  // explicitly makes sure that tree sitter is not loaded as it does not work in browser environments
  configureWebpack: {
    devServer: {
      host: "localhost",
      headers: { "Access-Control-Allow-Origin": "*" },
    },
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
