class Pearson {
  // Initialiseer de hashfunctie met een vervangingstabel en combinatiefunctie.
  constructor(tabel, combineer) {
    this.tabel = tabel || [...Array(256).keys()].reverse();
    this.combineer = combineer || ((h, v) => (h ^ v) % 256);
    for (let i = 0; i < 256; i++) {
      if (!this.tabel.includes(i)) {
        throw "AssertionError: ongeldige tabel";
      }
    }
    if (this.tabel.length !== 256) {
      throw "AssertionError: ongeldige tabel";
    }
  }

  // Bereken de hashwaarde van een string via de vervangingstabel.
  hash(s) {
    let h = 0;
    for (const c of s) {
      const code = c.charCodeAt(0);
      h = this.tabel[this.combineer(h, code)];
    }
    return h;
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

  set index(_v) {
    throw "AssertionError: can't set attribute";
  }

  get index() {
    return this.parent ? this.parent.index + 1 : 0;
  }

  set vorige_hash(_v) {
    throw "AssertionError: can't set attribute";
  }

  // Geef de hash van het ouderblok terug, of nul voor het genesisblok.
  get vorige_hash() {
    return this.parent ? this.parent.hash : 0;
  }

  // Voeg een nieuw blok met de gegeven datum toe aan het einde van de keten.
  toevoegen(s) {
    return new Blok(this.hasher, this, s);
  }

  // Controleer recursief of elk blok in de keten een geldige hashwaarde heeft.
  is_geldig() {
    return (
      (!this.parent || this.parent.is_geldig()) &&
      this.hash === this.hasher.hash(`${this.index}${this.datum}${this.vorige_hash}`)
    );
  }
}
