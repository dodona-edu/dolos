use std::fmt::Display;
use std::io::Error;

/// Put `context` in front of the message of `error`, such as
/// `could not read directory 'x': Permission denied`. The error kind stays the same.
pub(crate) fn context(error: Error, context: impl Display) -> Error {
    Error::new(error.kind(), format!("{context}: {error}"))
}
