"use strict";

// Graphify commands: build the compiler-derived semantic index and answer focused questions
// from it (`sage graphify build` / `sage graphify query`, Sage 0.35.2+). Nothing here parses Sage
// code; the compiler answers and the extension only presents the result.

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { runCompiler } = require("../host/compiler");
const { requireProjectRoot } = require("../host/project");
const graphify = require("../lib/graphify");
const diagnostics = require("../lib/diagnostics");
const { entryFile } = require("../lib/project");

const diskFileSystem = { isAbsolute: path.isAbsolute, join: path.join, exists: fs.existsSync };

/** Symbol under the cursor in a Sage editor, including qualified names such as `geometry::shift`. */
function symbolUnderCursor() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== "sage") return "";
  const range = editor.document.getWordRangeAtPosition(editor.selection.active, graphify.SYMBOL_PATTERN);
  return range ? editor.document.getText(range) : "";
}

/** Reports a failed Graphify run: compiler errors go to Problems, anything else to the channel. */
function reportFailure(channel, publisher, root, result) {
  channel.appendLine(result.output.trimEnd());
  publisher.publish(root, result.diagnostics, entryFile(root, path.join));
  vscode.window.showErrorMessage(
    result.diagnostics.length > 0
      ? "Sage Graphify: the project does not compile. See the Problems panel."
      : "Sage Graphify failed. See the Sage output channel."
  );
}

function startOutput(channel, title) {
  channel.clear();
  channel.show(true);
  channel.appendLine(`> ${title}\n`);
}

async function buildIndex(channel, publisher) {
  const root = requireProjectRoot();
  if (!root) return;
  await vscode.workspace.saveAll(false);
  startOutput(channel, `Graphify build: ${root}`);

  const result = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Window, title: "Sage: building Graphify index" },
    () => runCompiler(graphify.buildArguments(root), root)
  );
  if (result.code !== 0) {
    reportFailure(channel, publisher, root, result);
    return;
  }
  publisher.publish(root, [], entryFile(root, path.join));
  const stats = graphify.parseStats(result.stdout);
  const summary = stats ? graphify.describeStats(stats) : "Graphify index ready.";
  channel.appendLine(summary);
  vscode.window.showInformationMessage(summary);
}

async function pickKind() {
  const choice = await vscode.window.showQuickPick(
    graphify.QUERY_KINDS.map((entry) => ({ label: entry.label, description: entry.description, kind: entry.kind })),
    { placeHolder: "Graphify: what do you want to know?" }
  );
  return choice?.kind;
}

async function askSymbol(kind) {
  return vscode.window.showInputBox({
    prompt: `Graphify ${kind}: symbol name`,
    placeHolder: "add, geometry::shift, Point.x",
    value: symbolUnderCursor(),
    validateInput: (text) => (text.trim() === "" || text.trim().startsWith("-") ? "Enter a symbol name." : undefined)
  });
}

async function openLocation(root, item) {
  const file = graphify.resolveLocationFile(root, item.location.file, diskFileSystem);
  if (!file) {
    vscode.window.showInformationMessage(`${item.location.file} is not a file in this project.`);
    return;
  }
  const position = new vscode.Position(Math.max((item.location.line ?? 1) - 1, 0), Math.max((item.location.column ?? 1) - 1, 0));
  await vscode.window.showTextDocument(vscode.Uri.file(file), { selection: new vscode.Range(position, position) });
}

async function showLocations(root, envelope) {
  const items = graphify.describeLocations(envelope);
  if (items.length === 1) return openLocation(root, items[0]);
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: `${envelope.count} ${envelope.query} result(s) for '${envelope.name}'`,
    matchOnDescription: true,
    matchOnDetail: true
  });
  if (picked) await openLocation(root, picked);
}

async function runQuery(channel, publisher, kind, presetName) {
  const root = requireProjectRoot();
  if (!root) return;
  const queryKind = kind ?? (await pickKind());
  if (!queryKind) return;
  const name = presetName ?? (await askSymbol(queryKind));
  if (name === undefined || name.trim() === "") return;

  await vscode.workspace.saveAll(false);
  const asText = !graphify.isLocationKind(queryKind);
  startOutput(channel, `Graphify ${queryKind} ${name.trim()}`);
  const result = await runCompiler(graphify.queryArguments(queryKind, name, root, { human: asText }), root);
  if (result.code !== 0) {
    reportFailure(channel, publisher, root, result);
    return;
  }

  // A project that does not compile still answers from the last good index; surface why.
  const compileErrors = diagnostics.parseDiagnostics(result.stderr);
  publisher.publish(root, compileErrors, entryFile(root, path.join));
  const envelope = asText ? null : graphify.parseEnvelope(result.stdout);
  if (compileErrors.length > 0 || envelope?.stale || /index is stale/.test(result.stderr)) {
    vscode.window.showWarningMessage(
      "Sage Graphify: the project does not compile, so this answer comes from the last good index."
    );
  }

  if (asText) {
    channel.appendLine(result.stdout.trimEnd());
    return;
  }
  if (!envelope) {
    channel.appendLine(result.output.trimEnd());
    vscode.window.showErrorMessage("Sage Graphify: unexpected compiler output. See the Sage output channel.");
    return;
  }
  channel.appendLine(`${envelope.count} ${envelope.query} result(s) for '${envelope.name}'.`);
  if (envelope.count === 0) {
    vscode.window.showInformationMessage(`Sage Graphify: no ${envelope.query} results for '${envelope.name}'.`);
    return;
  }
  for (const item of graphify.describeLocations(envelope)) {
    channel.appendLine(`${item.detail}  ${item.label}${item.description ? `  (${item.description})` : ""}`);
  }
  await showLocations(root, envelope);
}

function registerGraphifyCommands(context, channel, publisher) {
  const register = (id, handler) => context.subscriptions.push(vscode.commands.registerCommand(id, handler));
  register("sage.graphify.build", () => buildIndex(channel, publisher));
  register("sage.graphify.query", () => runQuery(channel, publisher));
  register("sage.graphify.symbol", () => runQuery(channel, publisher, "symbol"));
  register("sage.graphify.callers", () => runQuery(channel, publisher, "callers"));
  register("sage.graphify.contract", () => runQuery(channel, publisher, "contract"));
}

module.exports = { registerGraphifyCommands };
