// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { PngSaver } from "./png_saver";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "svgasset" is now active!');

  PngSaver.register(context.subscriptions);
}

export function deactivate() {}
