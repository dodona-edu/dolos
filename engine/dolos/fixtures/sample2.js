class Pearson {
  constructor(tabel, combineer) {
    this.combineer = combineer || ((h, v) => (h ^ v) % 256);
    this.tabel = tabel || [...Array(256).keys()].reverse();
    const missing = [...Array(256).keys()].filter(i => !this.tabel.includes(i));
    if (this.tabel.length !== 256 || missing.length > 0) {
      throw "AssertionError: ongeldige tabel";
    }
  }

  hash(s) {
    return [...s].reduce((h, c) => this.tabel[this.combineer(h, c.charCodeAt(0))], 0);
  }
}

class Blok {
  constructor(hasher, parent, datum) {
    this.hasher = hasher || new Pearson();
    this.parent = parent || null;
    this.datum = datum || "Genesis Block";
    this.hash = this.hasher.hash(`${this.index}${this.datum}${this.vorige_hash}`);
  }

  get index() {
    let blok = this;
    let count = 0;
    while (blok.parent) {
      count++;
      blok = blok.parent;
    }
    return count;
  }

  set index(_v) {
    throw "AssertionError: can't set attribute";
  }

  get vorige_hash() {
    return this.parent ? this.parent.hash : 0;
  }

  set vorige_hash(_v) {
    throw "AssertionError: can't set attribute";
  }

  toevoegen(s) {
    return new Blok(this.hasher, this, s);
  }

  is_geldig() {
    const verwacht = this.hasher.hash(`${this.index}${this.datum}${this.vorige_hash}`);
    if (this.hash !== verwacht) return false;
    if (this.parent) return this.parent.is_geldig();
    return true;
  }
}
