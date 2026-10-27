"use strict";

// Runs the configured Sage compiler. This module talks to the VS Code configuration; the pure
// helpers it relies on live in ../lib so they can be unit-tested without VS Code.

const vscode = require("vscode");
const { parseCommand } = require("../lib/command");
const { runProcess } = require("../lib/process");
const diagnostics = require("../lib/diagnostics");

const VERSION_PROBE_TTL_MS = 60 * 1000;
const VERSION_PROBE_TIMEOUT_MS = 15 * 1000;

/** Resolves the configured compiler command into { program, baseArgs }. */
function resolveCompiler() {
  const command = vscode.workspace.getConfiguration("sage").get("command", "sage");
  const [program, ...baseArgs] = parseCommand(command);
  return { program, baseArgs };
}

/** Cache of `--version` probes, keyed by the full compiler command. */
const versionProbes = new Map();

/** Returns the compiler's `--version` text, cached briefly because starting .NET is not free. */
async function probeVersion(compiler) {
  const key = [compiler.program, ...compiler.baseArgs].join("\u0000");
  const cached = versionProbes.get(key);
  if (cached && Date.now() - cached.at < VERSION_PROBE_TTL_MS) return cached.text;

  const result = await runProcess(compiler.program, [...compiler.baseArgs, "--version"], {
    timeoutMs: VERSION_PROBE_TIMEOUT_MS
  });
  const text = result.code === 0 ? result.stdout : "";
  versionProbes.set(key, { at: Date.now(), text });
  return text;
}

/** Arguments that select the diagnostics format for the configured compiler. */
async function diagnosticsArguments(compiler) {
  const setting = vscode.workspace.getConfiguration("sage").get("diagnosticsFormat", "auto");
  if (setting === "human") return [];
  const version = setting === "auto" ? await probeVersion(compiler) : "";
  return diagnostics.diagnosticsArguments(setting, version);
}

/**
 * Runs the Sage compiler with `target` (a file, or a command such as `["build"]`) after the
 * diagnostics flag. Resolves with the human-readable output, the raw output, the exit code and
 * the parsed diagnostics, and never rejects.
 *
 * @param {string[]} target
 * @param {string} cwd
 * @param {string[]} [extraArgs]  Additional flags such as `--clean`.
 */
async function runCompiler(target, cwd, extraArgs = []) {
  let compiler;
  try {
    compiler = resolveCompiler();
  } catch (err) {
    return { output: err.message, raw: err.message, code: -1, diagnostics: [] };
  }
  const flags = await diagnosticsArguments(compiler);
  const result = await runProcess(
    compiler.program,
    [...compiler.baseArgs, ...flags, ...extraArgs, ...target],
    { cwd }
  );
  return {
    output: diagnostics.humanizeOutput(result.output),
    raw: result.output,
    code: result.code,
    diagnostics: result.code === 0 ? [] : diagnostics.parseDiagnostics(result.output)
  };
}

/** Flags every compile started from the editor passes, from the `sage.cleanBeforeRun` setting. */
function configuredFlags() {
  return vscode.workspace.getConfiguration("sage").get("cleanBeforeRun", false) ? ["--clean"] : [];
}

module.exports = { resolveCompiler, runCompiler, configuredFlags };
