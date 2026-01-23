use crate::winnowing::pair::Pair;

pub struct Report {
    pub pairs: Vec<Pair>,
}

impl Report {
    pub fn new() -> Report {
        Report { pairs: Vec::new() }
    }
    
    pub fn add(&mut self, pair: Pair) {
        self.pairs.push(pair);
    }
    
    pub fn from(pairs: Vec<Pair>) -> Report {
        Report { pairs }
    }
}
