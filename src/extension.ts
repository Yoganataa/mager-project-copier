// src/extension.ts
import * as vscode from 'vscode';
import { SidebarProvider } from './sidebar/SidebarProvider';

/**
 * Extension entry point.
 */
export function activate(context: vscode.ExtensionContext): void {
  const provider = new SidebarProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      provider
    )
  );
}

export function deactivate(): void {}
