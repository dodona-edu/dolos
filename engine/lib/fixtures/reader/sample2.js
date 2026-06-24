class Pearson {
  // Initialiseer de hashfunctie met een vervangingstabel en combinatiefunctie.
  constructor(tabel, combineer) {
    this.combineer = combineer || ((h, v) => (h ^ v) % 256);
    this.tabel = tabel || [...Array(256).keys()].reverse();
    const missing = [...Array(256).keys()].filter(i => !this.tabel.includes(i));
    if (this.tabel.length !== 256 || missing.length > 0) {
      throw "AssertionError: ongeldige tabel";
    }
  }

  // Bereken de hashwaarde van een string via de vervangingstabel.
  hash(s) {
    return [...s].reduce((h, c) => this.tabel[this.combineer(h, c.charCodeAt(0))], 0);
  }
}

class Blok {
  // Maak een nieuw blok aan en bereken direct de hashwaarde.
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

  // Geef de hash van het ouderblok terug, of nul voor het genesisblok.
  get vorige_hash() {
    return this.parent ? this.parent.hash : 0;
  }

  set vorige_hash(_v) {
    throw "AssertionError: can't set attribute";
  }

  // Voeg een nieuw blok met de gegeven datum toe aan het einde van de keten.
  toevoegen(s) {
    return new Blok(this.hasher, this, s);
  }

  // Controleer recursief of elk blok in de keten een geldige hashwaarde heeft.
  is_geldig() {
    const verwacht = this.hasher.hash(`${this.index}${this.datum}${this.vorige_hash}`);
    if (this.hash !== verwacht) return false;
    if (this.parent) return this.parent.is_geldig();
    return true;
  }
}
