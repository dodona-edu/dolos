use anstyle::{AnsiColor, Effects, Style};
use std::fmt;
use std::io::{Result, Write};
use tracing::field::{Field, Visit};
use tracing::{Event, Level, Subscriber};
use tracing_subscriber::Layer;
use tracing_subscriber::filter::{LevelFilter, Targets};
use tracing_subscriber::layer::{Context, SubscriberExt};
use tracing_subscriber::util::SubscriberInitExt;

/// Print the events of the `dolos` crates on stderr, from `level` up.
///
/// A warning prints as `warning: message` and an error as `error: message`.
pub fn init(level: LevelFilter) {
    tracing_subscriber::registry()
        .with(EventLayer.with_filter(Targets::new().with_target("dolos", level)))
        .init();
}

struct EventLayer;

impl<S: Subscriber> Layer<S> for EventLayer {
    fn on_event(&self, event: &Event<'_>, _ctx: Context<'_, S>) {
        let mut fields = Fields::default();
        event.record(&mut fields);
        // A failed write to stderr cannot be reported, so it is ignored.
        let _ = write_event(
            &mut anstream::stderr().lock(),
            *event.metadata().level(),
            &fields.message,
        );
    }
}

/// The fields of an event that the layer uses.
#[derive(Default)]
struct Fields {
    message: String,
}

impl Visit for Fields {
    fn record_debug(&mut self, field: &Field, value: &dyn fmt::Debug) {
        if field.name() == "message" {
            self.message = format!("{value:?}");
        }
    }
}

/// Write `message` as a line: plain for `info`, with a colored prefix such as `warning:` otherwise.
fn write_event(out: &mut impl Write, level: Level, message: &str) -> Result<()> {
    let (prefix, color) = match level {
        Level::INFO => return writeln!(out, "{message}"),
        Level::WARN => ("warning", AnsiColor::Yellow),
        Level::ERROR => ("error", AnsiColor::Red),
        Level::DEBUG => ("debug", AnsiColor::Blue),
        Level::TRACE => ("trace", AnsiColor::Cyan),
    };
    let style = Style::new()
        .fg_color(Some(color.into()))
        .effects(Effects::BOLD);
    writeln!(out, "{style}{prefix}:{style:#} {message}")
}
