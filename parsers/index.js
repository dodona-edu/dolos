
module.exports.bash = require("./build/Release/tree_sitter_bash_binding");
module.exports.bash.nodeTypeInfo = require("./bash/src/node-types.json");

module.exports.c = require("./build/Release/tree_sitter_c_binding");
module.exports.c.nodeTypeInfo = require("./c/src/node-types.json");

module.exports.cpp = require("./build/Release/tree_sitter_cpp_binding");
module.exports.cpp.nodeTypeInfo = require("./cpp/src/node-types.json");

module.exports["c-sharp"] = require("./build/Release/tree_sitter_c_sharp_binding");
module.exports["c-sharp"].nodeTypeInfo = require("./c_sharp/src/node-types.json");

module.exports.java = require("./build/Release/tree_sitter_java_binding");
module.exports.java.nodeTypeInfo = require("./java/src/node-types.json");

