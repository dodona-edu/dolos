class Pearson:
    # Initialiseer de hashfunctie met een vervangingstabel en combinatiefunctie.
    def __init__(self, tabel=None, combineer=None):
        self.tabel = tabel or list(range(256))
        if sorted(self.tabel) != list(range(256)):
            raise ValueError("ongeldige tabel")
        self.combineer = combineer or (lambda h, v: (h + v) % 256)

    # Bereken de hashwaarde van een string via de vervangingstabel.
    def hash(self, s):
        h = 0
        for c in s:
            h = self.tabel[self.combineer(h, ord(c))]
        return h
