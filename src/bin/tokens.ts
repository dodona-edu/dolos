import FileGroup from "../lib/files/fileGroup";
import { CodeTokenizer } from "../lib/tokenizers/codeTokenizer";

(async () => {
  const tokenizer = new CodeTokenizer("javascript");
  let resultString = "";
  const file = await FileGroup.asGroup(["samples/js/sample.js"]);
  for await (const { token } of tokenizer.generateTokensFromFile(file.first())) {
    resultString += token;
  }
  console.log(resultString);
})();
