/**
 * This is a function copied from sample.js
 */
function notCopiedHash(string) {
  let hash = 0;
  for (let character of string) {
    hash = this.tabel[this.combineer(hash, character.charCodeAt(0))];
  }
  return hash;
}
