"use strict";

// Pure helpers for the Sage compiler's Graphify tool (`sage graphify ...`, Sage 0.35.2+).
// See the compiler's docs/graphify.md for the query reference.

/** Queries the compiler accepts, with the question each one answers. */
const QUERY_KINDS = [
  { kind: "symbol", label: "Symbol", description: "Where a symbol is declared" },
  { kind: "refs", label: "References", description: "Calls, type uses and field uses of a symbol" },
  { kind: "callers", label: "Callers", description: "Call sites of a function" },
  { kind: "callees", label: "Callees", description: "Functions a function calls" },
  { kind: "contract", label: "Contract", description: "Ownership and borrow contract of a function" },
  { kind: "deps", label: "Dependencies", description: "Modules a module uses and is used by" },
  { kind: "module", label: "Module summary", description: "Compact summary of one module" }
];

/** Queries whose answers are source locations, shown in a pick list. The others are shown as text. */
const LOCATION_KINDS = new Set(["symbol", "refs", "callers", "callees"]);

/** Matches a symbol such as `add`, `geometry::add` or `Point.x`. */
const SYMBOL_PATTERN = /[A-Za-z_]\w*(?:(?:::|\.)[A-Za-z_]\w*)*/;

function isLocationKind(kind) {
  return LOCATION_KINDS.has(kind);
}

/** Arguments of `sage graphify build`, asking for the one-line JSON statistics. */
function buildArguments(root) {
  return ["graphify", "build", root, "--stats"];
}

/**
 * Arguments of `sage graphify query`.
 *
 * @param {string} kind
 * @param {string} name
 * @param {string} root
 * @param {{human?: boolean}} [options]  `human` selects the compiler's plain-text output.
 */
function queryArguments(kind, name, root, options = {}) {
  if (!QUERY_KINDS.some((entry) => entry.kind === kind)) throw new Error(`Unknown Graphify query '${kind}'.`);
  const symbol = String(name ?? "").trim();
  if (symbol === "") throw new Error("A symbol name is required.");
  if (symbol.startsWith("-")) throw new Error(`'${symbol}' is not a valid symbol name.`);
  return ["graphify", "query", kind, symbol, "--project", root, ...(options.human ? ["--human"] : [])];
}

/** Last stdout line that is a JSON object, decoded; null when there is none. */
function lastJsonObject(stdout) {
  const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.startsWith("{"));
  for (let index = lines.length - 1; index >= 0; index--) {
    try {
      return JSON.parse(lines[index]);
    } catch {
      // Not JSON: keep looking at earlier lines.
    }
  }
  return null;
}

/** Decodes the statistics printed by `graphify build --stats`. */
function parseStats(stdout) {
  const value = lastJsonObject(stdout);
  if (!value || typeof value.modules !== "number") return null;
  const names = (key) => (Array.isArray(value[key]) ? value[key] : []);
  return { modules: value.modules, written: names("written"), unchanged: names("unchanged"), removed: names("removed") };
}

/** One-line summary of build statistics for a notification. */
function describeStats(stats) {
  return `Graphify index ready: ${stats.modules} modules (${stats.written.length} updated, ` +
    `${stats.unchanged.length} unchanged, ${stats.removed.length} removed).`;
}

/** Decodes the query envelope `{query, name, count, results[], stale?}`; null when absent. */
function parseEnvelope(stdout) {
  const value = lastJsonObject(stdout);
  if (!value || typeof value.query !== "string" || !Array.isArray(value.results)) return null;
  return {
    query: value.query,
    name: String(value.name ?? ""),
    count: Number.isInteger(value.count) ? value.count : value.results.length,
    stale: value.stale === true,
    results: value.results
  };
}

function place(entry) {
  return { file: entry.file, line: entry.line, column: entry.column };
}

function positionText(location) {
  return location.file ? `${location.file}:${location.line ?? 1}` : "";
}

/**
 * Flattens a location-style envelope into pick-list items:
 * `{label, description, detail, location: {file, line, column}}`.
 */
function describeLocations(envelope) {
  const items = [];
  for (const result of envelope.results) {
    if (envelope.query === "symbol") {
      items.push({
        label: `${result.kind} ${result.name}`,
        description: result.detail ?? "",
        location: place(result)
      });
    } else if (envelope.query === "refs") {
      items.push({
        label: `${result.kind} ${result.name}`,
        description: result.in ? `in ${result.in}` : "module level",
        location: place(result)
      });
    } else if (envelope.query === "callers") {
      items.push({ label: `${result.caller} -> ${result.callee}`, description: "", location: place(result) });
    } else if (envelope.query === "callees") {
      for (const site of result.sites ?? []) {
        items.push({
          label: result.callee,
          description: result.native ? `${result.origin} (native)` : result.origin ?? "",
          location: place(site)
        });
      }
    }
  }
  return items.map((item) => ({ ...item, detail: positionText(item.location) }));
}

/**
 * Resolves a location's project-relative file against the project root. Returns null for files
 * that are not on disk, such as `std/<name>.sg` entries of an installed standard library.
 */
function resolveLocationFile(root, file, fileSystem) {
  if (!file) return null;
  const candidate = fileSystem.isAbsolute(file) ? file : fileSystem.join(root, file);
  return fileSystem.exists(candidate) ? candidate : null;
}

module.exports = {
  QUERY_KINDS,
  SYMBOL_PATTERN,
  isLocationKind,
  buildArguments,
  queryArguments,
  parseStats,
  describeStats,
  parseEnvelope,
  describeLocations,
  resolveLocationFile
};
