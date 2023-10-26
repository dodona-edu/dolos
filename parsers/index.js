
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

module.exports.php = require("./build/Release/tree_sitter_php_binding");
module.exports.php.nodeTypeInfo = require("./php/src/node-types.json");

module.exports.python = require("./build/Release/tree_sitter_python_binding");
module.exports.python.nodeTypeInfo = require("./python/src/node-types.json");
