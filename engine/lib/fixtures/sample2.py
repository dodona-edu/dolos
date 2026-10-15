class Pearson:
    def __init__(self, table=None, combine=None):
        self.table = table or list(range(256))
        if sorted(self.table) != list(range(256)):
            raise ValueError("invalid table")
        self.combine = combine or (lambda h, v: (h ^ v) % 256)

    def hash(self, text):
        result = 0
        for char in text:
            result = self.table[self.combine(result, ord(char))]
        return result
