// src/core/updateManager.ts
import * as vscode from 'vscode';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { isNewerVersion } from '../utils/semver';

/**
 * Represents the structure of a GitHub Release API response.
 */
interface GitHubRelease {
  tag_name: string;
  assets: {
    name: string;
    browser_download_url: string;
  }[];
  body: string;
}

/**
 * Manages the self-update mechanism for the extension by interfacing with GitHub Releases.
 * * This class handles checking for new versions, downloading the .vsix asset,
 * and triggering the installation process within VS Code.
 */
export class UpdateManager {
  private context: vscode.ExtensionContext;
  private githubRepo: string;

  /**
   * Creates an instance of UpdateManager.
   * * @param context - The extension context for accessing global storage and package JSON.
   * @param githubRepo - The repository identifier in "username/repo" format.
   */
  constructor(context: vscode.ExtensionContext, githubRepo: string) {
    this.context = context;
    this.githubRepo = githubRepo;
  }

  /**
   * Checks the GitHub repository for a newer release compared to the currently installed version.
   * * If an update is available, it prompts the user to update or view release notes.
   *
   * @param silent - If true, suppresses "up to date" notifications (useful for background checks).
   */
  public async checkForUpdates(silent = false) {
    try {
      const currentVersion = this.context.extension.packageJSON.version;
      
      const release = await this.fetchLatestRelease();
      if (!release) {return;}

      if (isNewerVersion(currentVersion, release.tag_name)) {
        const choice = await vscode.window.showInformationMessage(
          `Mager Project: New version ${release.tag_name} is available!`,
          'Update Now',
          'Release Notes',
          'Ignore'
        );

        if (choice === 'Update Now') {
          await this.performUpdate(release);
        } else if (choice === 'Release Notes') {
          vscode.env.openExternal(vscode.Uri.parse(`https://github.com/${this.githubRepo}/releases/tag/${release.tag_name}`));
        }
      } else if (!silent) {
        vscode.window.showInformationMessage('Mager Project is up to date.');
      }
    } catch (error) {
      console.error('Update check failed:', error);
      if (!silent) {vscode.window.showErrorMessage('Failed to check for updates.');}
    }
  }

  /**
   * Orchestrates the download and installation of the new extension version.
   * * @param release - The GitHub release object containing the asset information.
   */
  private async performUpdate(release: GitHubRelease) {
    const asset = release.assets.find(a => a.name.endsWith('.vsix'));
    if (!asset) {
      vscode.window.showErrorMessage('No .vsix file found in the latest release.');
      return;
    }

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Downloading Update ${release.tag_name}...`,
      cancellable: false
    }, async (progress) => {
      try {
        const tempPath = path.join(this.context.globalStorageUri.fsPath, asset.name);
        await this.downloadFile(asset.browser_download_url, tempPath);

        progress.report({ message: 'Installing...' });
        await vscode.commands.executeCommand('workbench.extensions.installExtension', vscode.Uri.file(tempPath));

        const reload = await vscode.window.showInformationMessage(
          'Update installed! Reload window to apply?',
          'Reload'
        );
        if (reload === 'Reload') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      } catch (err) {
        vscode.window.showErrorMessage(`Update failed: ${err}`);
      }
    });
  }

  /**
   * Fetches the latest release data from the GitHub API.
   * * @returns A promise resolving to the {@link GitHubRelease} object or null if the request fails.
   */
  private fetchLatestRelease(): Promise<GitHubRelease | null> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.githubRepo}/releases/latest`,
        headers: { 'User-Agent': 'VSCode-Extension' }
      };

      https.get(options, (res) => {
        if (res.statusCode !== 200) {
          resolve(null); 
          return;
        }
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch { resolve(null); }
        });
      }).on('error', reject);
    });
  }

  /**
   * Downloads a file from a given URL to a local destination.
   * * Handles HTTP 301/302 redirects which are common with GitHub release assets.
   *
   * @param url - The source URL.
   * @param dest - The local file path to save the download.
   */
  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) {fs.mkdirSync(dir, { recursive: true });}

      const file = fs.createWriteStream(dest);
      https.get(url, { headers: { 'User-Agent': 'VSCode-Extension' } }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          this.downloadFile(res.headers.location!, dest).then(resolve).catch(reject);
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });
  }
}