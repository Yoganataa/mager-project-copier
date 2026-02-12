use thiserror::Error;
use std::path::PathBuf;

#[derive(Error, Debug)]
pub enum Error {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Scanning error: {0}")]
    Scan(String),

    #[error("Ignore pattern error: {0}")]
    Ignore(#[from] ::ignore::Error),

    #[error("Template '{0}' not found")]
    TemplateNotFound(String),

    #[error("Path not found: {0}")]
    PathNotFound(PathBuf),

    #[error("Framework detection error: {0}")]
    FrameworkDetection(String),

    #[error("Token estimation error: {0}")]
    TokenEstimation(String),

    #[error("Clipboard error: {0}")]
    Clipboard(String),

    #[error("Snapshot generation error: {0}")]
    Snapshot(String),
}

pub type Result<T> = std::result::Result<T, Error>;
