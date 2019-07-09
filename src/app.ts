import { Tokenizer } from "./lib/tokenizer";

(async () => {
  const tokenizer = new Tokenizer("javascript");
  let resultString = "";
  const positionMapping: number[] = [];
  for await (const [token, range] of tokenizer.generateTokensFromFile("samples/js/sample.js")) {
    resultString += token;
    positionMapping.push(...new Array(token.length).fill(range.start.row));
  }
  console.log(resultString, positionMapping.join(","));
})();
