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
        // TODO: implement this function
        let r = 256;
        for (let i = 0; i < 256; i++) {
            r -=1;
        }
        let a = r, b = 0;
        while(b < s.length) {
            const c = s[b].charCodeAt(0);
            const x = this.combineer(c, a);
            a = this.tabel[x];
            b += 1;
        }
        return a;
    }
}
