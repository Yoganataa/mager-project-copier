use clap::Parser;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;
use mager_core::{
    scanner::{Scanner, ScanOptions},
    snapshot::{MarkdownGenerator, SnapshotGenerator},
    templates,
};
use std::path::PathBuf;
use std::io::{self, Write};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to the project to scan
    #[arg(short, long, default_value = ".")]
    path: String,

    /// Verbose logging
    #[arg(short, long)]
    verbose: bool,

    /// Output file path (default: stdout)
    #[arg(short, long)]
    output: Option<PathBuf>,

    /// Template ID to apply (e.g., "default", "review", "explain")
    #[arg(short, long, default_value = "default")]
    template: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    let level = if args.verbose { Level::DEBUG } else { Level::INFO };
    let subscriber = FmtSubscriber::builder()
        .with_max_level(level)
        .finish();

    tracing::subscriber::set_global_default(subscriber)
        .expect("setting default subscriber failed");

    let root_path = PathBuf::from(&args.path);
    if !root_path.exists() {
        eprintln!("Error: Path '{}' does not exist.", args.path);
        std::process::exit(1);
    }

    info!("Scanning path: {}", root_path.display());

    let options = ScanOptions {
        root_path: root_path.clone(),
        ..Default::default()
    };

    let scanner = Scanner::new(options);
    let root = scanner.scan()?;

    info!("Scan complete. Generating snapshot...");

    // Generate raw snapshot into memory first if we need to apply a template that wraps it
    // Wait, the template system assumes string-in-string-out.
    // Ideally we stream to the template, but for now let's just generate to a buffer
    // and then apply the template string wrapper.
    // Optimization: If template is "Default", we can stream directly to file.

    let mut buffer = Vec::new();
    let generator = MarkdownGenerator;
    generator.generate(&root, &mut buffer)?;

    let raw_snapshot = String::from_utf8(buffer)?;

    // Apply template
    let template = templates::get_template(&args.template)
        .unwrap_or_else(|_| {
            eprintln!("Warning: Template '{}' not found, using 'default'.", args.template);
            templates::get_template("default").unwrap()
        });

    let final_output = template.render(&raw_snapshot);

    if let Some(output_path) = args.output {
        std::fs::write(&output_path, final_output)?;
        info!("Snapshot saved to {}", output_path.display());
    } else {
        // Write to stdout
        io::stdout().write_all(final_output.as_bytes())?;
    }

    Ok(())
}
