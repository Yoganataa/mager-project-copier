// src/utils/fs.ts
import * as vscode from 'vscode';

/**
 * Reads a UTF-8 text file safely.
 * Binary or unreadable files are skipped.
 *
 * @param uri - VS Code file URI
 * @returns File content or null if unreadable
 */
export async function readTextFile(
  uri: vscode.Uri
): Promise<string | null> {
  try {
    const buffer = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(buffer).toString('utf8');
  } catch {
    return null;
  }
}
