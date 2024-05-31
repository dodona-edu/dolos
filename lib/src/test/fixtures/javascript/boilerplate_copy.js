class Pearson {
    constructor(tabel, combineer) {
        this.tabel = tabel || [...new Array(256).keys()];
        if (this.tabel.length !== 256) {
            throw "AssertionError: ongeldige tabel";
        }
        for (let i = 0; i < 256; i++) {
            if (!this.tabel.includes(i)) {
                throw "AssertionError: ongeldige tabel";
            }
        }
        this.combineer = combineer || ((h, v) => (h + v) % 256);
    }

    hash(s) {
        // TODO: IMPLEMENT THIS FUNCTION
    }
}
