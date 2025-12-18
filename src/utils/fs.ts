// src/utils/fs.ts
import * as vscode from 'vscode';

/**
 * Asynchronously reads the content of a file located at the specified URI.
 *
 * This utility is designed to safely handle text files by assuming UTF-8 encoding.
 * If the file cannot be read (e.g., does not exist, permission denied, or is binary/unreadable),
 * the function gracefully catches the error and returns `null` instead of throwing.
 *
 * @param uri - The Universal Resource Identifier (URI) of the file to read.
 * @returns A promise that resolves to the file content as a string, or `null` if the operation fails.
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