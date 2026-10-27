"use strict";

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { findProjectRoot } = require("../lib/project");

const diskFileSystem = { exists: fs.existsSync, dirname: path.dirname, join: path.join };

/**
 * Finds the Sage project (a directory with `src/main.sg`) for the active editor, falling back to
 * the workspace folders. Returns null when none contains a project.
 */
function currentProjectRoot() {
  const candidates = [];
  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document.uri.scheme === "file") candidates.push(editor.document.uri.fsPath);
  for (const folder of vscode.workspace.workspaceFolders ?? []) candidates.push(folder.uri.fsPath);

  for (const candidate of candidates) {
    const root = findProjectRoot(candidate, diskFileSystem);
    if (root) return root;
  }
  return null;
}

/** Like currentProjectRoot, but tells the user how to fix the situation when there is none. */
function requireProjectRoot() {
  const root = currentProjectRoot();
  if (!root) {
    vscode.window.showWarningMessage(
      "Sage: no project found. Open a file of a project that has src/main.sg, or open its folder."
    );
  }
  return root;
}

module.exports = { currentProjectRoot, requireProjectRoot };
