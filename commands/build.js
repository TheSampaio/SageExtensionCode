"use strict";

// "Sage: Build Project" and "Sage: Clean Build" run `sage build` (optionally with `--clean`) in
// the project that contains the active file.

const vscode = require("vscode");
const path = require("path");
const { runCompiler } = require("../host/compiler");
const { requireProjectRoot } = require("../host/project");
const { entryFile } = require("../lib/project");

async function buildProject(channel, publisher, { clean }) {
  const root = requireProjectRoot();
  if (!root) return;
  await vscode.workspace.saveAll(false);

  const label = clean ? "clean build" : "build";
  channel.clear();
  channel.show(true);
  channel.appendLine(`> Sage ${label}: ${root}\n`);

  const { output, code, diagnostics: found } = await runCompiler(["build"], root, clean ? ["--clean"] : []);
  publisher.publish(root, found, entryFile(root, path.join));
  if (output.trim()) channel.appendLine(output.trimEnd());
  if (code === 0) {
    channel.appendLine(`Sage ${label} succeeded.`);
  } else {
    channel.appendLine(`Sage ${label} failed (exit code ${code}).`);
  }
}

function registerBuildCommands(context, channel, publisher) {
  context.subscriptions.push(
    vscode.commands.registerCommand("sage.buildProject", () => buildProject(channel, publisher, { clean: false })),
    vscode.commands.registerCommand("sage.cleanBuild", () => buildProject(channel, publisher, { clean: true }))
  );
}

module.exports = { registerBuildCommands };
