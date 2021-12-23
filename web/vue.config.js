// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");

module.exports = {
  publicPath: "./",
  transpileDependencies: [
    "vuetify"
  ],
  chainWebpack: config => {
    config.module.rule("ts").use("ts-loader").tap(options => {
      options.compiler = "ttypescript";
      return options;
    });

    config.module.rule("tsx").use("ts-loader").tap(options => {
      options.compiler = "ttypescript";
      return options;
    });
  },
  // explicitly makes sure that tree sitter is not loaded as it does not work in browser environments
  configureWebpack: {
    plugins: [
      new webpack.IgnorePlugin({
        resourceRegExp: /tree-sitter/
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /codeTokenizer/,
        contextRegExp: /library/
      })
    ]
  }
  /*
  chainWebpack: config => {
    config.module
      .rule("ts")
      .use("ts-loader")
      .tap(options => {
        options.transpileOnly = false;
        options.getCustomTransformers = program => ({
          before: [typescriptIsTransformer(program)],
        });
        return options;
      });

    config.module
      .rule("tsx")
      .use("ts-loader")
      .tap(options => {
        options.transpileOnly = false;
        options.getCustomTransformers = program => ({
          before: [typescriptIsTransformer(program)],
        });
        return options;
      });

    config.module
      .rule("vue")
      .use("vue-loader")
      .tap(vueOptions => {
        vueOptions.esModule = true;
        vueOptions.loaders.ts = [{
          loader: "ts-loader",
          options: {
            getCustomTransformers: program => ({
              before: [typescriptIsTransformer(program)],
            })
          }
        }];
        return vueOptions;
      });
  }
    const external = config.module.rule("ts");
    external.exclude.add(path.join(__dirname, "src"));
    external.use("babel-loader").options({});

    const internal = config.module.rule("ts-internal");
    internal.test(/\.ts$/).include.add(path.join(__dirname, "src"));

    external.uses.values().forEach(use => {
      internal.use(use.name).merge(use.entries());
    });

    internal.use("ts-loader")
      .loader("ts-loader")
      .tap(opts => {
        opts.transpileOnly = false;
        opts.getCustomTransformers = program => ({
          before: [typescriptIsTransformer(program)],
        });
        return opts;
      });
  }, */
};
