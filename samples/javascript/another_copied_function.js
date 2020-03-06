this.combineer = combineer || ((h, v) => (h + v) % 256);

function is_geldig() {
    return (
        (!this.parent || this.parent.is_geldig()) &&
        this.hash === this.hasher.hash(`${this.index}${this.datum}${this.vorige_hash}`)
    );
}