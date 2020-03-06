/**
 * This is a function copied from sample.js
 */
function hash(s) {
  let h = 0;
  for (let c of s) {
    h = this.tabel[this.combineer(h, c.charCodeAt(0))];
  }
  return h;
}
