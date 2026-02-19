use std::rc::Rc;
use crate::file::File;
use crate::suffixtree::analysis::AnalysisResult;

pub struct Report {
    pub analysis_result: AnalysisResult,
    pub files: Vec<Rc<File>>
}

impl Report {
    pub fn from(analysis_result: AnalysisResult, files: Vec<Rc<File>>) -> Report {
        Report { analysis_result, files }
    }
}
