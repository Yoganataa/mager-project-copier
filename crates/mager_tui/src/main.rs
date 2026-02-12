use std::path::PathBuf;
use std::time::Duration;
use clap::Parser;

mod app;
mod tui;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to the project to scan
    #[arg(short, long, default_value = ".")]
    path: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    let root_path = PathBuf::from(&args.path);

    if !root_path.exists() {
        eprintln!("Path does not exist: {}", args.path);
        std::process::exit(1);
    }

    // Initialize TUI
    let mut terminal = tui::init()?;
    let mut app = app::App::new(root_path);

    // Auto-scan on startup
    if let Err(e) = app.scan() {
        app.status_message = format!("Scan failed: {}", e);
    }

    loop {
        terminal.draw(|f| app::ui(f, &mut app))?;

        if crossterm::event::poll(Duration::from_millis(100))? {
            let key = crossterm::event::read()?;
            if let crossterm::event::Event::Key(key) = key {
                app.on_key(key);
            }
        }

        if app.should_quit {
            break;
        }
    }

    tui::restore()?;
    Ok(())
}
