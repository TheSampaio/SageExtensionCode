"use strict";

// Publishes Sage compiler diagnostics to the VS Code Problems panel.

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const diagnostics = require("../lib/diagnostics");

const diskFileSystem = { exists: fs.existsSync, dirname: path.dirname, join: path.join };

/** Range for a compiler position, widened to the word at that position when the document is open. */
function rangeFor(uri, diagnostic) {
  const line = Math.max((diagnostic.line ?? 1) - 1, 0);
  const column = Math.max((diagnostic.column ?? 1) - 1, 0);
  const position = new vscode.Position(line, column);
  const document = vscode.workspace.textDocuments.find((entry) => entry.uri.toString() === uri.toString());
  const word = document && line < document.lineCount ? document.getWordRangeAtPosition(position) : undefined;
  return word ?? new vscode.Range(position, position);
}

function toVsCodeDiagnostic(uri, compiledFile, diagnostic) {
  const result = new vscode.Diagnostic(
    rangeFor(uri, diagnostic),
    diagnostics.problemMessage(diagnostic),
    diagnostic.severity === "warning" ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error
  );
  result.source = "sage";
  result.code = diagnostic.code;
  result.relatedInformation = diagnostic.related
    .filter((entry) => entry.file && entry.line)
    .map((entry) => {
      const relatedFile = diagnostics.resolveDiagnosticFile({ file: entry.file }, compiledFile, diskFileSystem);
      const position = new vscode.Position(entry.line - 1, Math.max((entry.column ?? 1) - 1, 0));
      const text = [entry.symbol, entry.note].filter(Boolean).join(": ") || "related location";
      return new vscode.DiagnosticRelatedInformation(
        new vscode.Location(vscode.Uri.file(relatedFile), position),
        text
      );
    });
  return result;
}

/** Owns the "sage" DiagnosticCollection and replaces what each compiled target published before. */
class DiagnosticPublisher {
  constructor() {
    this.collection = vscode.languages.createDiagnosticCollection("sage");
    this.published = new Map();
  }

  /**
   * Replaces the diagnostics published for `compiledFile` (a file or project directory).
   * Returns the location of the first diagnostic, or undefined when there is none.
   */
  publish(compiledFile, found, baseFile = compiledFile) {
    for (const previous of this.published.get(compiledFile) ?? []) this.collection.delete(previous);

    const uris = [];
    let firstLocation;
    for (const [file, entries] of diagnostics.groupByFile(found, baseFile, diskFileSystem)) {
      const uri = vscode.Uri.file(file);
      const converted = entries.map((entry) => toVsCodeDiagnostic(uri, baseFile, entry));
      this.collection.set(uri, converted);
      uris.push(uri);
      firstLocation ??= new vscode.Location(uri, converted[0].range);
    }
    this.published.set(compiledFile, uris);
    return firstLocation;
  }

  dispose() {
    this.collection.dispose();
  }
}

module.exports = { DiagnosticPublisher };
