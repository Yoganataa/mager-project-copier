// src/core/updateManager.ts
import * as vscode from 'vscode';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { isNewerVersion } from '../utils/semver';

/**
 * Defines the structure of the JSON response returned by the GitHub Releases API.
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
 * Manages the extension's self-update mechanism by interfacing with GitHub Releases.
 * * This class is responsible for:
 * - Checking for new versions relative to the installed package.json version.
 * - Downloading the `.vsix` asset from the latest release.
 * - Triggering the VS Code internal command to install the downloaded extension.
 */
export class UpdateManager {
  private context: vscode.ExtensionContext;
  private githubRepo: string;

  /**
   * Initializes a new instance of the UpdateManager.
   * * @param context - The extension context, used for accessing global storage paths and package metadata.
   * @param githubRepo - The repository identifier in the format "username/repo" (e.g., "owner/project").
   */
  constructor(context: vscode.ExtensionContext, githubRepo: string) {
    this.context = context;
    this.githubRepo = githubRepo;
  }

  /**
   * Queries the GitHub repository to determine if a newer release is available.
   * * If an update is found, this method prompts the user via a VS Code information message
   * to either update immediately, view release notes, or ignore.
   * * @param silent - If `true`, suppresses notifications when the extension is already up-to-date.
   * Useful for background checks during startup.
   */
  public async checkForUpdates(silent = false) {
    try {
      const currentVersion = this.context.extension.packageJSON.version;
      console.log(`[UpdateManager] Checking for updates... (Local version: ${currentVersion})`);

      const release = await this.fetchLatestRelease();
      
      if (!release) {
        console.warn('[UpdateManager] Could not fetch release info. Possible network issue or API rate limit.');
        return;
      }

      console.log(`[UpdateManager] Latest GitHub Release: ${release.tag_name}`);

      if (isNewerVersion(currentVersion, release.tag_name)) {
        console.log('[UpdateManager] Newer version found! Prompting user...');
        
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
      } else {
        console.log('[UpdateManager] Extension is already up to date.');
        if (!silent) {
          vscode.window.showInformationMessage('Mager Project is up to date.');
        }
      }
    } catch (error) {
      console.error('[UpdateManager] Critical error during check:', error);
      if (!silent) {
          vscode.window.showErrorMessage('Failed to check for updates. See Debug Console for details.');
      }
    }
  }

  /**
   * Orchestrates the download and installation process for a specific release.
   * * This method:
   * 1. Identifies the `.vsix` asset in the release payload.
   * 2. Downloads the file to the global storage directory.
   * 3. Executes the VS Code command to install the extension from the local VSIX file.
   * 4. Prompts the user to reload the window upon completion.
   * * @param release - The release object containing asset URLs and version information.
   */
  private async performUpdate(release: GitHubRelease) {
    console.log('[UpdateManager] Starting update process...');
    
    const asset = release.assets.find(a => a.name.endsWith('.vsix'));
    
    if (!asset) {
      const msg = 'No .vsix file found in the latest GitHub release assets.';
      console.error(`[UpdateManager] ${msg}`);
      vscode.window.showErrorMessage(msg);
      return;
    }

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Downloading Update ${release.tag_name}...`,
      cancellable: false
    }, async (progress) => {
      try {
        const tempPath = path.join(this.context.globalStorageUri.fsPath, asset.name);
        console.log(`[UpdateManager] Downloading to: ${tempPath}`);

        await this.downloadFile(asset.browser_download_url, tempPath);

        progress.report({ message: 'Installing...' });
        console.log('[UpdateManager] Installing .vsix...');
        
        await vscode.commands.executeCommand('workbench.extensions.installExtension', vscode.Uri.file(tempPath));
        console.log('[UpdateManager] Installation command executed.');

        const reload = await vscode.window.showInformationMessage(
          'Update installed! Reload window to apply?',
          'Reload'
        );
        if (reload === 'Reload') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      } catch (err) {
        console.error('[UpdateManager] Update failed:', err);
        vscode.window.showErrorMessage(`Update failed: ${err}`);
      }
    });
  }

  /**
   * Performs an HTTPS GET request to the GitHub API to retrieve the latest release metadata.
   * * @returns A promise that resolves to the {@link GitHubRelease} object if successful, or `null` otherwise.
   */
  private fetchLatestRelease(): Promise<GitHubRelease | null> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.githubRepo}/releases/latest`,
        headers: { 
            'User-Agent': 'VSCode-Extension-MagerProject', 
            'Accept': 'application/vnd.github.v3+json'
        }
      };

      console.log(`[UpdateManager] Requesting: https://${options.hostname}${options.path}`);

      https.get(options, (res) => {
        if (res.statusCode !== 200) {
          console.error(`[UpdateManager] API Error: StatusCode ${res.statusCode} (${res.statusMessage})`);
          if (res.statusCode === 403) {
             console.warn('[UpdateManager] Rate limit exceeded. Try again later.');
          }
          resolve(null); 
          return;
        }

        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) { 
            console.error('[UpdateManager] JSON Parse Error:', e);
            resolve(null); 
          }
        });
      }).on('error', (e) => {
          console.error('[UpdateManager] Network Request Error:', e);
          reject(e);
      });
    });
  }

  /**
   * Downloads a file from the specified URL to a local destination path.
   * * This method handles HTTP 301/302 redirects recursively, which are standard for GitHub release assets.
   * It ensures the destination directory exists before writing.
   * * @param url - The source URL of the file to download.
   * @param dest - The absolute local file path where the content will be saved.
   * @returns A promise that resolves when the download is complete and the file stream is closed.
   */
  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) {fs.mkdirSync(dir, { recursive: true });}

      const file = fs.createWriteStream(dest);
      
      https.get(url, { headers: { 'User-Agent': 'VSCode-Extension-MagerProject' } }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          if (res.headers.location) {
             console.log(`[UpdateManager] Redirecting to: ${res.headers.location}`);
             this.downloadFile(res.headers.location, dest).then(resolve).catch(reject);
          } else {
             reject(new Error('Redirect with no location header'));
          }
          return;
        }

        if (res.statusCode !== 200) {
            reject(new Error(`Download failed with status code ${res.statusCode}`));
            return;
        }

        res.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log('[UpdateManager] Download complete.');
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {}); 
        reject(err);
      });
    });
  }
}