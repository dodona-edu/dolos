import svelte from "rollup-plugin-svelte";
import copy from "rollup-plugin-copy";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import postCss from "rollup-plugin-postcss";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/view/main.ts",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "dist/view/build/bundle.js"
  },
  plugins: [
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file - better for performance
      css: css => {
        css.write("dist/view/build/bundle.css");
      }
    }),

    copy({
      targets: [
        { src: "src/view/*.{html,css}", dest: "dist/view" }
      ]
    }),

    postCss({
      extract: true,
      minimize: true,
      use: [
        ["sass", { includePaths: ["./node_modules", "./src/view"] }]
      ]
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: i => i === "svelte" || i.startsWith("svelte/")
    }),
    commonjs(),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    //!production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload("dist/view"),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
};