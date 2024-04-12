
module.exports.bash = require("./build/Release/tree_sitter_bash_binding");
module.exports.bash.nodeTypeInfo = require("./bash/src/node-types.json");

module.exports.c = require("./build/Release/tree_sitter_c_binding");
module.exports.c.nodeTypeInfo = require("./c/src/node-types.json");

module.exports.cpp = require("./build/Release/tree_sitter_cpp_binding");
module.exports.cpp.nodeTypeInfo = require("./cpp/src/node-types.json");

module.exports["c-sharp"] = require("./build/Release/tree_sitter_c_sharp_binding");
module.exports["c-sharp"].nodeTypeInfo = require("./c_sharp/src/node-types.json");

module.exports.elm = require("./build/Release/tree_sitter_elm_binding");
module.exports.elm.nodeTypeInfo = require("./elm/src/node-types.json");

module.exports.java = require("./build/Release/tree_sitter_java_binding");
module.exports.java.nodeTypeInfo = require("./java/src/node-types.json");

module.exports.javascript = require("./build/Release/tree_sitter_javascript_binding");
module.exports.javascript.nodeTypeInfo = require("./javascript/src/node-types.json");

module.exports.modelica = require("./build/Release/tree_sitter_modelica_binding");
module.exports.modelica.nodeTypeInfo = require("./modelica/src/node-types.json");

module.exports.php = require("./build/Release/tree_sitter_php_binding");
module.exports.php.nodeTypeInfo = require("./php/src/node-types.json");

module.exports.python = require("./build/Release/tree_sitter_python_binding");
module.exports.python.nodeTypeInfo = require("./python/src/node-types.json");

module.exports.r = require("./build/Release/tree_sitter_r_binding");
module.exports.r.nodeTypeInfo = require("./r/src/node-types.json");

module.exports.sql = require("./build/Release/tree_sitter_sql_binding");
module.exports.sql.nodeTypeInfo = require("./sql/src/node-types.json");

const typescript_tsx = require("./build/Release/tree_sitter_typescript_binding");
module.exports.typescript = typescript_tsx.typescript;
module.exports.typescript.nodeTypeInfo = require("./typescript/typescript/src/node-types.json");

module.exports.tsx = typescript_tsx.tsx;
module.exports.tsx.nodeTypeInfo = require("./typescript/tsx/src/node-types.json");

module.exports.verilog = require("./build/Release/tree_sitter_verilog_binding");
module.exports.verilog.nodeTypeInfo = require("./verilog/src/node-types.json");
