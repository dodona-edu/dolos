// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const sass = require("sass");

module.exports = {
  publicPath: "./",
  transpileDependencies: ["vuetify"],
  // explicitly makes sure that tree sitter is not loaded as it does not work in browser environments
  configureWebpack: {
    resolve: {
      fallback: {
        "path": false,
        "fs": false,
        "assert": require.resolve("assert/"),
      },
    },
    plugins: [
      new webpack.IgnorePlugin({
        resourceRegExp: /tree-sitter/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /codeTokenizer/,
        contextRegExp: /library/,
      }),
      new MonacoWebpackPlugin()
    ],
  },
  css: {
    loaderOptions: {
      sass: {
        sassOptions: {
          logger: sass.Logger.silent
        }
      }
    }
  }
};
