// Sage Programming Language — VS Code extension entry point.
//
// Provides:
//   * "Sage: Run Current File" command.
//   * A Test Explorer runner that discovers *.test.sg files, runs them through the
//     Sage compiler, and parses the "[PASS] name" / "[FAIL] name (detail)" lines each
//     assertion prints (see the `test` standard-library module).
//
// Authored in plain JavaScript so the extension runs without a build step.

const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const { parseCommand } = require("./lib/command");
const { parseResults } = require("./lib/test-results");

/** Resolves the configured compiler command into { program, baseArgs }. */
function resolveCompiler() {
  const command = vscode.workspace.getConfiguration("sage").get("command", "sage");
  const [program, ...baseArgs] = parseCommand(command);
  return { program, baseArgs };
}

/** Runs the Sage compiler on a file and resolves with its combined output. */
function runCompiler(filePath) {
  return new Promise((resolve) => {
    let program;
    let baseArgs;
    try {
      ({ program, baseArgs } = resolveCompiler());
    } catch (err) {
      resolve({ output: err.message, code: -1 });
      return;
    }
    let output = "";
    let proc;
    try {
      proc = cp.spawn(program, [...baseArgs, filePath], {
        cwd: path.dirname(filePath),
        windowsHide: true
      });
    } catch (err) {
      resolve({ output: `Failed to launch Sage compiler ('${program}'): ${err.message}`, code: -1 });
      return;
    }
    proc.stdout.on("data", (d) => (output += d.toString()));
    proc.stderr.on("data", (d) => (output += d.toString()));
    proc.on("error", (err) => resolve({ output: output + `\n${err.message}`, code: -1 }));
    proc.on("close", (code) => resolve({ output, code }));
  });
}

// --------------------------------------------------------------------------
// Run Current File command
// --------------------------------------------------------------------------

async function runCurrentFile(channel) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== "sage") {
    vscode.window.showWarningMessage("Sage: open a .sg file to run it.");
    return;
  }
  await editor.document.save();
  const filePath = editor.document.uri.fsPath;

  channel.clear();
  channel.show(true);
  channel.appendLine(`> Running ${path.basename(filePath)} ...\n`);

  const { output, code } = await runCompiler(filePath);
  channel.appendLine(output.trimEnd());
  if (code !== 0) channel.appendLine(`Sage exited with code ${code}.`);
}

// --------------------------------------------------------------------------
// Test Explorer
// --------------------------------------------------------------------------

function testGlob() {
  return vscode.workspace.getConfiguration("sage").get("testGlob", "**/*.test.sg");
}

function getOrCreateFileItem(controller, uri) {
  const existing = controller.items.get(uri.toString());
  if (existing) return existing;
  const item = controller.createTestItem(uri.toString(), path.basename(uri.fsPath), uri);
  item.canResolveChildren = false;
  controller.items.add(item);
  return item;
}

async function discoverAllTests(controller) {
  const files = await vscode.workspace.findFiles(testGlob(), "**/{node_modules,bin,obj}/**");
  const seen = new Set();
  for (const uri of files) {
    seen.add(uri.toString());
    getOrCreateFileItem(controller, uri);
  }
  // Drop items whose files disappeared.
  const toDelete = [];
  controller.items.forEach((item) => {
    if (!seen.has(item.id)) toDelete.push(item.id);
  });
  toDelete.forEach((id) => controller.items.delete(id));
}

async function runFileTest(controller, run, fileItem) {
  run.started(fileItem);
  const started = Date.now();
  const { output, code } = await runCompiler(fileItem.uri.fsPath);
  if (code !== 0) {
    run.errored(fileItem, new vscode.TestMessage(output.trim() || `Sage exited with code ${code}.`));
    return;
  }
  const results = parseResults(output);

  if (results.length === 0) {
    run.errored(
      fileItem,
      new vscode.TestMessage("No test results were produced. Compiler output:\n\n" + output.trim())
    );
    return;
  }

  let anyFailed = false;
  for (const r of results) {
    const childId = `${fileItem.id}::${r.name}`;
    let child = fileItem.children.get(childId);
    if (!child) {
      child = controller.createTestItem(childId, r.name, fileItem.uri);
      fileItem.children.add(child);
    }

    run.started(child);
    if (r.passed) {
      run.passed(child);
    } else {
      anyFailed = true;
      run.failed(child, new vscode.TestMessage(r.detail || "assertion failed"));
    }
  }

  const duration = Date.now() - started;
  if (anyFailed) {
    run.failed(fileItem, new vscode.TestMessage("One or more assertions failed."), duration);
  } else {
    run.passed(fileItem, duration);
  }
}

async function runHandler(controller, request, token) {
  const run = controller.createTestRun(request);
  const queue = [];

  if (request.include) {
    request.include.forEach((t) => queue.push(t));
  } else {
    controller.items.forEach((t) => queue.push(t));
  }

  const visited = new Set();
  try {
    for (const test of queue) {
      if (token.isCancellationRequested) break;
      const fileItem = controller.items.get(test.uri.toString());
      if (!fileItem || visited.has(fileItem.id)) continue;
      if (request.exclude && request.exclude.includes(fileItem)) continue;
      visited.add(fileItem.id);
      await runFileTest(controller, run, fileItem);
    }
  } finally {
    run.end();
  }
}

// --------------------------------------------------------------------------
// Activation
// --------------------------------------------------------------------------

function activate(context) {
  const channel = vscode.window.createOutputChannel("Sage");
  context.subscriptions.push(channel);

  context.subscriptions.push(
    vscode.commands.registerCommand("sage.runFile", () => runCurrentFile(channel))
  );

  const controller = vscode.tests.createTestController("sageTests", "Sage Tests");
  context.subscriptions.push(controller);

  controller.resolveHandler = async (item) => {
    if (!item) await discoverAllTests(controller);
  };

  controller.createRunProfile(
    "Run",
    vscode.TestRunProfileKind.Run,
    (request, token) => runHandler(controller, request, token),
    true
  );

  // Watch the workspace for test files appearing, changing, or being removed.
  const watcher = vscode.workspace.createFileSystemWatcher(testGlob());
  watcher.onDidCreate((uri) => getOrCreateFileItem(controller, uri));
  watcher.onDidDelete((uri) => controller.items.delete(uri.toString()));
  context.subscriptions.push(watcher);

  discoverAllTests(controller);
}

function deactivate() {}

module.exports = { activate, deactivate };
