const parsers = {};

parsers.bash = require("./build/Release/tree_sitter_bash_binding");
parsers.bash.nodeTypeInfo = require("./bash/src/node-types.json");

parsers.c = require("./build/Release/tree_sitter_c_binding");
parsers.c.nodeTypeInfo = require("./c/src/node-types.json");

parsers.cpp = require("./build/Release/tree_sitter_cpp_binding");
parsers.cpp.nodeTypeInfo = require("./cpp/src/node-types.json");

parsers["c-sharp"] = require("./build/Release/tree_sitter_c_sharp_binding");
parsers["c-sharp"].nodeTypeInfo = require("./c_sharp/src/node-types.json");

parsers.elm = require("./build/Release/tree_sitter_elm_binding");
parsers.elm.nodeTypeInfo = require("./elm/src/node-types.json");

parsers.java = require("./build/Release/tree_sitter_java_binding");
parsers.java.nodeTypeInfo = require("./java/src/node-types.json");

parsers.go = require("./build/Release/tree_sitter_go_binding");
parsers.go.nodeTypeInfo = require("./go/src/node-types.json");

parsers.groovy = require("./build/Release/tree_sitter_groovy_binding");
parsers.groovy.nodeTypeInfo = require("./groovy/src/node-types.json");

parsers.javascript = require("./build/Release/tree_sitter_javascript_binding");
parsers.javascript.nodeTypeInfo = require("./javascript/src/node-types.json");

parsers.modelica = require("./build/Release/tree_sitter_modelica_binding");
parsers.modelica.nodeTypeInfo = require("./modelica/src/node-types.json");

parsers.ocaml = require("./build/Release/tree_sitter_ocaml_binding").ocaml;
parsers.ocaml.nodeTypeInfo = require("./ocaml/grammars/ocaml/src/node-types.json");

// Note: this parser provides php_only and php (includes HTML)
parsers.php = require("./build/Release/tree_sitter_php_binding").php;
parsers.php.nodeTypeInfo = require("./php/php/src/node-types.json");

parsers.python = require("./build/Release/tree_sitter_python_binding");
parsers.python.nodeTypeInfo = require("./python/src/node-types.json");

parsers.r = require("./build/Release/tree_sitter_r_binding");
parsers.r.nodeTypeInfo = require("./r/src/node-types.json");

parsers.rust = require("./build/Release/tree_sitter_rust_binding");
parsers.rust.nodeTypeInfo = require("./rust/src/node-types.json");

parsers.scala = require("./build/Release/tree_sitter_scala_binding");
parsers.scala.nodeTypeInfo = require("./scala/src/node-types.json");

parsers.sql = require("./build/Release/tree_sitter_sql_binding");
parsers.sql.nodeTypeInfo = require("./sql/src/node-types.json");

const typescript_tsx = require("./build/Release/tree_sitter_typescript_binding");
parsers.typescript = typescript_tsx.typescript;
parsers.typescript.nodeTypeInfo = require("./typescript/typescript/src/node-types.json");

parsers.tsx = typescript_tsx.tsx;
parsers.tsx.nodeTypeInfo = require("./typescript/tsx/src/node-types.json");

parsers.verilog = require("./build/Release/tree_sitter_verilog_binding");
parsers.verilog.nodeTypeInfo = require("./verilog/src/node-types.json");

// Converting tree-sitter 0.21 parsers is a no-op
const convert = require("tree-sitter-compat").convertLanguage;
for (const [key, value] of Object.entries(parsers)) {
  module.exports[key] = convert(value);
}
