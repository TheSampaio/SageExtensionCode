"use strict";

// Pure helpers for Sage compiler diagnostics. They never touch the VS Code API so they can be
// unit-tested in plain Node. The compiler documents both formats in its `docs/diagnostics.md`.

/** Compiler version that introduced `--diagnostics json`. */
const JSON_DIAGNOSTICS_MIN_VERSION = [0, 35, 0];

/** The human format `file(line,col): error CODE: message`, shared with the `$sage` problem matcher. */
const HUMAN_RE = /^(.+)\((\d+),(\d+)\): (error|warning) (S\d+): (.*)$/;
const CODE_RE = /^S\d+$/;
const VERSION_RE = /v?(\d+)\.(\d+)\.(\d+)/;

/**
 * @typedef {object} SageDiagnostic
 * @property {string} code        Stable code such as `S101`.
 * @property {"error"|"warning"} severity
 * @property {string} [file]      File name as printed by the compiler (no directory).
 * @property {string} [path]      Absolute path, present in the JSON format when the file was read.
 * @property {number} [line]      1-based line, omitted for failures without a location.
 * @property {number} [column]    1-based column.
 * @property {string} message
 * @property {string} [rule]
 * @property {string} [suggestion]
 * @property {Array<{symbol?: string, note?: string, file?: string, line?: number, column?: number}>} related
 */

/** Normalizes one decoded JSON object, or returns null when it is not a Sage diagnostic. */
function fromJsonObject(value) {
  if (!value || typeof value !== "object") return null;
  if (typeof value.code !== "string" || !CODE_RE.test(value.code)) return null;
  if (typeof value.message !== "string") return null;

  const diagnostic = {
    code: value.code,
    severity: value.severity === "warning" ? "warning" : "error",
    message: value.message,
    related: Array.isArray(value.related) ? value.related.filter((entry) => entry && typeof entry === "object") : []
  };
  for (const key of ["file", "path", "rule", "suggestion"]) {
    if (typeof value[key] === "string" && value[key] !== "") diagnostic[key] = value[key];
  }
  for (const key of ["line", "column"]) {
    if (Number.isInteger(value[key]) && value[key] > 0) diagnostic[key] = value[key];
  }
  return diagnostic;
}

/** Parses `--diagnostics json` output: one JSON object per line. Other lines are ignored. */
function parseJsonDiagnostics(output) {
  const diagnostics = [];
  for (const raw of output.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith("{")) continue;
    let value;
    try {
      value = JSON.parse(line);
    } catch {
      continue;
    }
    const diagnostic = fromJsonObject(value);
    if (diagnostic) diagnostics.push(diagnostic);
  }
  return diagnostics;
}

/**
 * Parses the human format. Indented lines that follow a diagnostic are its continuation
 * (for example the "Checked:" list of S007) and are appended to the message.
 */
function parseHumanDiagnostics(output) {
  const diagnostics = [];
  let current = null;
  for (const line of output.split(/\r?\n/)) {
    const match = HUMAN_RE.exec(line);
    if (match) {
      current = {
        code: match[5],
        severity: match[4],
        file: match[1],
        line: Number(match[2]),
        column: Number(match[3]),
        message: match[6],
        related: []
      };
      diagnostics.push(current);
    } else if (current && /^\s+\S/.test(line)) {
      current.message += "\n" + line.trim();
    } else {
      current = null;
    }
  }
  return diagnostics;
}

/** Parses compiler output in either format; JSON wins when both are present. */
function parseDiagnostics(output) {
  const structured = parseJsonDiagnostics(output);
  return structured.length > 0 ? structured : parseHumanDiagnostics(output);
}

/** Extracts `[major, minor, patch]` from `sage --version` output, or null. */
function parseVersion(text) {
  const match = VERSION_RE.exec(text);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

/** Compares two `[major, minor, patch]` tuples. */
function compareVersions(left, right) {
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) return left[index] < right[index] ? -1 : 1;
  }
  return 0;
}

/** True when the compiler version printed by `--version` understands `--diagnostics json`. */
function supportsJsonDiagnostics(versionOutput) {
  const version = parseVersion(versionOutput || "");
  return version !== null && compareVersions(version, JSON_DIAGNOSTICS_MIN_VERSION) >= 0;
}

/**
 * Chooses the compiler's diagnostics flag. `setting` is `auto`, `json` or `human`;
 * `auto` uses JSON only when the detected compiler supports it.
 */
function diagnosticsArguments(setting, versionOutput) {
  const useJson = setting === "json" || (setting !== "human" && supportsJsonDiagnostics(versionOutput));
  return useJson ? ["--diagnostics", "json"] : [];
}

/**
 * Chooses the file a diagnostic belongs to. `path` from the JSON format wins; otherwise the
 * bare file name is looked up next to the file being compiled, and finally the compiled file
 * itself is used (file-less failures such as S900 land there too).
 *
 * @param {SageDiagnostic} diagnostic
 * @param {string} compiledFile  Absolute path handed to the compiler.
 * @param {{exists: (candidate: string) => boolean, dirname: (value: string) => string, join: (...parts: string[]) => string}} fileSystem
 */
function resolveDiagnosticFile(diagnostic, compiledFile, fileSystem) {
  if (diagnostic.path) return diagnostic.path;
  if (diagnostic.file) {
    const sibling = fileSystem.join(fileSystem.dirname(compiledFile), diagnostic.file);
    if (fileSystem.exists(sibling)) return sibling;
  }
  return compiledFile;
}

/** Groups diagnostics by resolved file path, preserving compiler order. */
function groupByFile(diagnostics, compiledFile, fileSystem) {
  const groups = new Map();
  for (const diagnostic of diagnostics) {
    const target = resolveDiagnosticFile(diagnostic, compiledFile, fileSystem);
    if (!groups.has(target)) groups.set(target, []);
    groups.get(target).push(diagnostic);
  }
  return groups;
}

/** Formats a diagnostic the way the compiler prints it in the human format. */
function formatHuman(diagnostic) {
  const head = `${diagnostic.severity} ${diagnostic.code}: ${diagnostic.message}`;
  if (diagnostic.line === undefined) return head;
  const file = diagnostic.file ?? "";
  return `${file}(${diagnostic.line},${diagnostic.column ?? 1}): ${head}`;
}

/** Message shown in the Problems panel: the compiler message plus its reliable suggestion. */
function problemMessage(diagnostic) {
  return diagnostic.suggestion
    ? `${diagnostic.message}\nSuggestion: ${diagnostic.suggestion}`
    : diagnostic.message;
}

/**
 * Rewrites JSON diagnostic lines of compiler output into the human format so the output channel
 * reads the same whichever format was requested. Other lines are kept unchanged.
 */
function humanizeOutput(output) {
  return output
    .split(/\r?\n/)
    .map((line) => {
      const [diagnostic] = line.trim().startsWith("{") ? parseJsonDiagnostics(line) : [];
      if (!diagnostic) return line;
      return diagnostic.suggestion
        ? `${formatHuman(diagnostic)}\n  Suggestion: ${diagnostic.suggestion}`
        : formatHuman(diagnostic);
    })
    .join("\n");
}

module.exports = {
  JSON_DIAGNOSTICS_MIN_VERSION,
  parseJsonDiagnostics,
  parseHumanDiagnostics,
  parseDiagnostics,
  parseVersion,
  supportsJsonDiagnostics,
  diagnosticsArguments,
  resolveDiagnosticFile,
  groupByFile,
  formatHuman,
  problemMessage,
  humanizeOutput
};
