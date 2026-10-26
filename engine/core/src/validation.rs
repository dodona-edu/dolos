//! What makes the input of an analysis valid.
//!
//! [`validate_input`] is the single statement of
//! [`analyze`](crate::analyze)'s contract. `analyze` runs it before it builds
//! anything, so the algorithm never sees an input it cannot handle.

use crate::Symbol;
use crate::analysis::AnalysisOptions;
use crate::suffixtree::SENTINEL_SYMBOL;
use std::io::{Error, ErrorKind, Result};
use std::ops::Range;

/// Check that [`analyze`](crate::analyze) accepts this input.
///
/// There must be at least two sequences, because the analysis compares pairs.
/// `ignored` is `None`, or one list of ranges per sequence. A range must not
/// start after it ends, and must stay within the sequence it indexes. Empty and
/// overlapping ranges are allowed, and the order of the ranges does not matter.
///
/// # Errors
///
/// Returns the first rule that the input breaks, as an
/// [`ErrorKind::InvalidInput`] error.
pub(crate) fn validate_input(
    sequences: &[Vec<Symbol>],
    ignored: Option<&[Vec<Range<usize>>]>,
    options: &AnalysisOptions,
) -> Result<()> {
    sequences_form_at_least_one_pair(sequences)?;
    match_length_is_positive(options)?;
    sequences_leave_the_sentinel_free(sequences)?;
    ignored_ranges_fit_their_sequence(sequences, ignored)
}

/// The analysis reports one result per pair, and a pair needs two sequences.
fn sequences_form_at_least_one_pair(sequences: &[Vec<Symbol>]) -> Result<()> {
    if sequences.len() < 2 {
        let message = format!(
            "the analysis needs at least 2 sequences to form a pair, it has {}",
            sequences.len()
        );
        return Err(Error::new(ErrorKind::InvalidInput, message));
    }

    Ok(())
}

/// A match of no symbols is not a match.
fn match_length_is_positive(options: &AnalysisOptions) -> Result<()> {
    if options.min_match_length == 0 {
        let message = "the minimum match length must be at least 1".to_string();
        return Err(Error::new(ErrorKind::InvalidInput, message));
    }

    Ok(())
}

/// The tree appends [`SENTINEL_SYMBOL`] to every sequence, so no input may hold
/// it: two sequences would compare equal where they do not match.
fn sequences_leave_the_sentinel_free(sequences: &[Vec<Symbol>]) -> Result<()> {
    for (sequence, symbols) in sequences.iter().enumerate() {
        if let Some(position) = symbols.iter().position(|&symbol| symbol == SENTINEL_SYMBOL) {
            let message = format!(
                "position {position} of sequence {sequence} holds the reserved end-of-sequence symbol"
            );
            return Err(Error::new(ErrorKind::InvalidInput, message));
        }
    }

    Ok(())
}

/// An ignore list indexes the sequences by position, so a partial list would
/// silently ignore the wrong ones. A range that reaches past its sequence marks
/// bits of the next one and underflows the totals that subtract it.
fn ignored_ranges_fit_their_sequence(
    sequences: &[Vec<Symbol>],
    ignored: Option<&[Vec<Range<usize>>]>,
) -> Result<()> {
    let Some(ignored) = ignored else {
        return Ok(());
    };

    if ignored.len() != sequences.len() {
        let message = format!(
            "the ignored positions cover {} sequences, the analysis has {}",
            ignored.len(),
            sequences.len()
        );
        return Err(Error::new(ErrorKind::InvalidInput, message));
    }

    for (sequence, ranges) in ignored.iter().enumerate() {
        let length = sequences[sequence].len();

        for range in ranges {
            if range.start > range.end {
                let message =
                    format!("ignored range {range:?} of sequence {sequence} starts after it ends");
                return Err(Error::new(ErrorKind::InvalidInput, message));
            }
            if range.end > length {
                let message = format!(
                    "ignored range {range:?} of sequence {sequence} reaches past its length {length}"
                );
                return Err(Error::new(ErrorKind::InvalidInput, message));
            }
        }
    }

    Ok(())
}

#[cfg(test)]
// The tests below build empty and reversed ranges on purpose: they are what
// `validate_input` has to accept and reject.
#[allow(clippy::reversed_empty_ranges, clippy::single_range_in_vec_init)]
mod tests {
    use super::*;

    fn options() -> AnalysisOptions {
        AnalysisOptions { min_match_length: 1, keep_matches: true }
    }

    /// The message of a rejected input, with its kind checked.
    fn rejection(result: Result<()>) -> String {
        let error = result.unwrap_err();

        assert_eq!(error.kind(), ErrorKind::InvalidInput);
        error.to_string()
    }

    /// An empty ignore list, an empty range and overlapping ranges are all legal.
    #[test]
    fn validate_input_accepts_valid_input() {
        let sequences = vec![vec![1, 2, 3, 4], vec![1, 2]];

        assert!(validate_input(&sequences, None, &options()).is_ok());
        assert!(
            validate_input(
                &sequences,
                Some(&[vec![1..1, 0..3, 2..4], vec![0..2]]),
                &options()
            )
            .is_ok()
        );
    }

    #[test]
    fn validate_input_rejects_fewer_than_two_sequences() {
        let rejected = rejection(validate_input(&[vec![1, 2]], None, &options()));

        assert!(rejected.contains("at least 2 sequences"), "{rejected}");
    }

    #[test]
    fn validate_input_rejects_the_reserved_sentinel() {
        let sequences = vec![vec![1, 2], vec![3, SENTINEL_SYMBOL]];
        let rejected = rejection(validate_input(&sequences, None, &options()));

        assert!(rejected.contains("position 1 of sequence 1"), "{rejected}");
    }

    #[test]
    fn validate_input_rejects_a_zero_min_match_length() {
        let options = AnalysisOptions { min_match_length: 0, keep_matches: false };
        let rejected = rejection(validate_input(&[vec![1, 2], vec![3, 4]], None, &options));

        assert!(rejected.contains("minimum match length"), "{rejected}");
    }

    /// A range that reaches past its sequence corrupts the totals, so it is
    /// rejected even though the mask would accept it.
    #[test]
    fn validate_input_rejects_ignored_ranges_outside_their_sequence() {
        let sequences = vec![vec![1, 2, 3], vec![1, 2]];

        let rejected = rejection(validate_input(
            &sequences,
            Some(&[vec![0..4], vec![]]),
            &options(),
        ));
        assert!(rejected.contains("reaches past its length 3"), "{rejected}");

        let rejected = rejection(validate_input(
            &sequences,
            Some(&[vec![2..1], vec![]]),
            &options(),
        ));
        assert!(rejected.contains("starts after it ends"), "{rejected}");
    }

    /// An empty list is not the way to ignore nothing. `None` is.
    #[test]
    fn validate_input_rejects_an_ignore_list_that_covers_the_wrong_number_of_sequences() {
        let sequences = vec![vec![1, 2], vec![3, 4]];
        let rejected = rejection(validate_input(&sequences, Some(&[]), &options()));

        assert!(
            rejected.contains("cover 0 sequences, the analysis has 2"),
            "{rejected}"
        );
    }
}
