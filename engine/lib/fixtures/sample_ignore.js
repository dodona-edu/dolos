class Blok {
  set index(_v) {
    throw "AssertionError: can't set attribute";
  }

  set vorige_hash(_v) {
    throw "AssertionError: can't set attribute";
  }

  get vorige_hash() {
    return this.parent ? this.parent.hash : 0;
  }
}
