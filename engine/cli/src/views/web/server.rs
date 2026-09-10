use axum::Router;
use std::io::{Error, Result};
use std::path::{Path, PathBuf};
use tower_http::services::ServeDir;

/// Where the report is served, and whether to open a browser.
pub struct Server {
    pub host: String,
    pub port: u16,
    pub open_browser: bool,
}

/// Serve `report_dir` until the process is stopped.
pub fn serve(report_dir: &Path, server: &Server) -> Result<()> {
    let router = build_router(report_dir, &webroot());
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;

    runtime.block_on(async move {
        let listener = tokio::net::TcpListener::bind((server.host.as_str(), server.port)).await?;
        let url = format!("http://{}:{}", server.host, server.port);
        println!("Dolos is available on {url}");

        if server.open_browser {
            println!("Opening the web page in your browser...");
            // A browser that does not start is not fatal: the server is already usable.
            if let Err(e) = open::that_detached(&url) {
                eprintln!("Could not open the browser: {e}");
            }
        }

        println!("Press Ctrl-C to exit.");
        axum::serve(listener, router).await.map_err(Error::other)
    })
}

/// The directory with the dolos-web frontend files.
// TODO: decide where the frontend files come from and return that directory here.
// The Node CLI takes the path from the `@dodona/dolos-web` package (`webroot()`).
// This build needs its own source: a path from the build script, an embedded copy of
// the assets, or a path from an environment variable.
fn webroot() -> PathBuf {
    todo!("return the directory with the dolos-web frontend files")
}

/// Route the report directory and the frontend.
fn build_router(report_dir: &Path, webroot: &Path) -> Router {
    Router::new()
        // The frontend reads the report from `/data`.
        .nest_service("/data", ServeDir::new(report_dir))
        // Every other path is a frontend file. A directory serves its `index.html`.
        .fallback_service(ServeDir::new(webroot))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    /// `/data` serves the report files, `/` serves the frontend `index.html`, and
    /// an unknown path returns 404.
    #[tokio::test]
    async fn test_routes() {
        let report_dir = tempfile::TempDir::new().unwrap();
        std::fs::write(report_dir.path().join("pairs.csv"), "file1_id\n").unwrap();
        let webroot = tempfile::TempDir::new().unwrap();
        std::fs::write(webroot.path().join("index.html"), "<html></html>").unwrap();
        let router = build_router(report_dir.path(), webroot.path());

        let get = |path: &str| {
            router
                .clone()
                .oneshot(Request::builder().uri(path).body(Body::empty()).unwrap())
        };

        assert_eq!(
            get("/data/pairs.csv").await.unwrap().status(),
            StatusCode::OK
        );
        assert_eq!(
            get("/data/missing.csv").await.unwrap().status(),
            StatusCode::NOT_FOUND
        );
        assert_eq!(get("/").await.unwrap().status(), StatusCode::OK);
        assert_eq!(
            get("/missing").await.unwrap().status(),
            StatusCode::NOT_FOUND
        );
    }
}
