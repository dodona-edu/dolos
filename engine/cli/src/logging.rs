use anstyle::{AnsiColor, Style};
use indicatif::{ProgressBar, ProgressStyle};
use std::fmt;
use std::io::{IsTerminal, Result, Write};
use std::time::Duration;
use tracing::field::{Field, Visit};
use tracing::span::{Attributes, Id, Record};
use tracing::{Event, Level, Subscriber};
use tracing_subscriber::Layer;
use tracing_subscriber::filter::{LevelFilter, Targets};
use tracing_subscriber::layer::{Context, SubscriberExt};
use tracing_subscriber::registry::LookupSpan;
use tracing_subscriber::util::SubscriberInitExt;

/// Print the steps, warnings and errors of the `dolos` crates on stderr, from `level` up.
///
/// A span with a `description` field is a step. In a terminal, a step shows as a
/// spinner that turns into `✔ description time` when the span closes, or `✘` when
/// the span has an `error` field. Elsewhere, a step prints its description when it
/// starts. A warning prints as `warning: message` and an error as `error: message`.
pub fn init(level: LevelFilter) {
    let layer = StepLayer { terminal: std::io::stderr().is_terminal() };
    tracing_subscriber::registry()
        .with(layer.with_filter(Targets::new().with_target("dolos", level)))
        .init();
}

struct StepLayer {
    terminal: bool,
}

/// A running step, stored in the extensions of its span.
struct Step {
    spinner: ProgressBar,
    failed: bool,
}

impl<S> Layer<S> for StepLayer
where
    S: Subscriber + for<'a> LookupSpan<'a>,
{
    fn on_new_span(&self, attrs: &Attributes<'_>, id: &Id, ctx: Context<'_, S>) {
        let mut fields = Fields::default();
        attrs.record(&mut fields);
        let (Some(description), Some(span)) = (fields.description, ctx.span(id)) else {
            return;
        };

        if !self.terminal {
            // A failed write to stderr cannot be reported, so it is ignored.
            let _ = writeln!(anstream::stderr().lock(), "{description}");
            return;
        }
        let spinner = start_spinner(description);
        span.extensions_mut()
            .insert(Step { spinner, failed: false });
    }

    fn on_record(&self, id: &Id, values: &Record<'_>, ctx: Context<'_, S>) {
        let mut fields = Fields::default();
        values.record(&mut fields);
        if fields.error.is_none() {
            return;
        }
        if let Some(span) = ctx.span(id)
            && let Some(step) = span.extensions_mut().get_mut::<Step>()
        {
            step.failed = true;
        }
    }

    fn on_event(&self, event: &Event<'_>, ctx: Context<'_, S>) {
        let mut fields = Fields::default();
        event.record(&mut fields);
        let write = || {
            let _ = write_event(
                &mut anstream::stderr().lock(),
                *event.metadata().level(),
                &fields.message,
            );
        };

        let spinner = ctx.event_scope(event).and_then(|mut scope| {
            scope.find_map(|span| {
                span.extensions()
                    .get::<Step>()
                    .map(|step| step.spinner.clone())
            })
        });
        match spinner {
            Some(spinner) => spinner.suspend(write),
            None => write(),
        }
    }

    fn on_close(&self, id: Id, ctx: Context<'_, S>) {
        let Some(step) = ctx
            .span(&id)
            .and_then(|span| span.extensions_mut().remove::<Step>())
        else {
            return;
        };
        let (mark, style) = if step.failed {
            ("✘", AnsiColor::Red.on_default().bold())
        } else {
            ("✔", AnsiColor::Green.on_default().bold())
        };
        let description = step.spinner.message();
        let seconds = step.spinner.elapsed().as_secs_f64();
        let line = format!(
            "{style}{mark}{style:#} {description} {dimmed}{seconds:.1}s{dimmed:#}",
            dimmed = Style::new().dimmed(),
        );

        let template = ProgressStyle::with_template("{msg}").expect("the template is valid");
        step.spinner.set_style(template);
        step.spinner.finish_with_message(line);
    }
}

/// The fields of a span or event that the layer uses.
#[derive(Default)]
struct Fields {
    message: String,
    description: Option<String>,
    error: Option<String>,
}

impl Visit for Fields {
    fn record_debug(&mut self, field: &Field, value: &dyn fmt::Debug) {
        let value = format!("{value:?}");
        match field.name() {
            "message" => self.message = value,
            "description" => self.description = Some(value),
            "error" => self.error = Some(value),
            _ => {}
        }
    }
}

/// Start a spinner on stderr that shows `message` and the time since the start.
fn start_spinner(message: String) -> ProgressBar {
    let spinner = ProgressBar::new_spinner().with_message(message);
    let style = ProgressStyle::with_template("{spinner:.cyan} {msg} {elapsed:.dim}")
        .expect("the template is valid");
    spinner.set_style(style);
    spinner.enable_steady_tick(Duration::from_millis(80));
    spinner
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
    let style = color.on_default().bold();
    writeln!(out, "{style}{prefix}:{style:#} {message}")
}
