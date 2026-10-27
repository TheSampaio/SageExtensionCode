"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const graphify = require("../lib/graphify");

// Output captured from `sage graphify` (Sage 0.37.3).
const SYMBOL = '{"query":"symbol","name":"main","count":2,"results":[{"kind":"module","name":"main","module":"main","file":"src/main.sg","line":1,"column":1,"detail":"project"},{"kind":"function","name":"main","module":"main","file":"src/main.sg","line":3,"column":1,"detail":"func main(): none"}]}';
const REFS = '{"query":"refs","name":"Point","count":2,"results":[{"kind":"type","name":"Point","module":"geometry","file":"src/geometry.sg","line":5,"column":5,"in":"geometry::read"},{"kind":"type","name":"Point","module":"main","file":"src/main.sg","line":6,"column":5}]}';
const CALLERS = '{"query":"callers","name":"geometry::shift","count":1,"results":[{"caller":"main","callee":"geometry::shift","module":"main","file":"src/main.sg","line":7,"column":5}]}';
const CALLEES = '{"query":"callees","name":"main","count":2,"results":[{"callee":"console::print_line","origin":"console","native":false,"sites":[{"file":"src/main.sg","line":9,"column":5},{"file":"src/main.sg","line":10,"column":5}]},{"callee":"stdio::puts","origin":"stdio","native":true,"sites":[{"file":"src/main.sg","line":11,"column":5}]}]}';

test("lists every query kind the compiler supports", () => {
  assert.deepEqual(
    graphify.QUERY_KINDS.map((entry) => entry.kind).sort(),
    ["callees", "callers", "contract", "deps", "module", "refs", "symbol"]
  );
  assert.equal(graphify.isLocationKind("callers"), true);
  assert.equal(graphify.isLocationKind("contract"), false);
});

test("builds graphify build arguments", () => {
  assert.deepEqual(graphify.buildArguments("C:/proj"), ["graphify", "build", "C:/proj", "--stats"]);
});

test("builds graphify query arguments with an optional human flag", () => {
  assert.deepEqual(graphify.queryArguments("callers", "geometry::shift", "C:/proj"), [
    "graphify", "query", "callers", "geometry::shift", "--project", "C:/proj"
  ]);
  assert.deepEqual(graphify.queryArguments("contract", " shift ", "C:/proj", { human: true }), [
    "graphify", "query", "contract", "shift", "--project", "C:/proj", "--human"
  ]);
});

test("rejects unknown queries and unusable symbol names", () => {
  assert.throws(() => graphify.queryArguments("bogus", "x", "."), /Unknown Graphify query/);
  assert.throws(() => graphify.queryArguments("symbol", "   ", "."), /symbol name is required/);
  assert.throws(() => graphify.queryArguments("symbol", undefined, "."), /symbol name is required/);
  assert.throws(() => graphify.queryArguments("symbol", "--project", "."), /not a valid symbol name/);
});

test("parses build statistics and describes them", () => {
  const stats = graphify.parseStats('{"modules":3,"written":["geometry","main"],"unchanged":["console"],"removed":[]}\n');
  assert.deepEqual(stats, { modules: 3, written: ["geometry", "main"], unchanged: ["console"], removed: [] });
  assert.equal(
    graphify.describeStats(stats),
    "Graphify index ready: 3 modules (2 updated, 1 unchanged, 0 removed)."
  );
  assert.equal(graphify.parseStats(""), null);
  assert.equal(graphify.parseStats("main.sg(1,1): error S007: Module 'x' not found."), null);
});

test("parses the query envelope, including the stale marker", () => {
  const envelope = graphify.parseEnvelope(`${SYMBOL}\r\n`);
  assert.equal(envelope.query, "symbol");
  assert.equal(envelope.count, 2);
  assert.equal(envelope.stale, false);

  const stale = graphify.parseEnvelope(SYMBOL.replace(/\}$/, ',"stale":true}'));
  assert.equal(stale.stale, true);
  assert.equal(graphify.parseEnvelope("graphify: Unknown query"), null);
  assert.equal(graphify.parseEnvelope('{"modules":1}'), null);
});

test("takes the last JSON object when other lines precede it", () => {
  const envelope = graphify.parseEnvelope(`{"code":"S101"}\n${CALLERS}`);
  assert.equal(envelope.query, "callers");
});

test("describes symbol results", () => {
  const items = graphify.describeLocations(graphify.parseEnvelope(SYMBOL));
  assert.equal(items.length, 2);
  assert.equal(items[1].label, "function main");
  assert.equal(items[1].description, "func main(): none");
  assert.equal(items[1].detail, "src/main.sg:3");
  assert.deepEqual(items[1].location, { file: "src/main.sg", line: 3, column: 1 });
});

test("describes reference and caller results", () => {
  const refs = graphify.describeLocations(graphify.parseEnvelope(REFS));
  assert.equal(refs[0].description, "in geometry::read");
  assert.equal(refs[1].description, "module level");

  const callers = graphify.describeLocations(graphify.parseEnvelope(CALLERS));
  assert.equal(callers[0].label, "main -> geometry::shift");
  assert.equal(callers[0].detail, "src/main.sg:7");
});

test("expands each call site of a callee into its own item", () => {
  const items = graphify.describeLocations(graphify.parseEnvelope(CALLEES));
  assert.deepEqual(items.map((item) => item.detail), ["src/main.sg:9", "src/main.sg:10", "src/main.sg:11"]);
  assert.equal(items[0].description, "console");
  assert.equal(items[2].description, "stdio (native)");
});

test("returns no items for an empty answer", () => {
  const empty = graphify.parseEnvelope('{"query":"symbol","name":"nothing","count":0,"results":[]}');
  assert.deepEqual(graphify.describeLocations(empty), []);
});

test("resolves locations against the project root and skips files that are not on disk", () => {
  const root = path.resolve(path.sep, "work", "app");
  const onDisk = path.join(root, "src", "main.sg");
  const fileSystem = { isAbsolute: path.isAbsolute, join: path.join, exists: (candidate) => candidate === onDisk };
  assert.equal(graphify.resolveLocationFile(root, "src/main.sg", fileSystem), onDisk);
  assert.equal(graphify.resolveLocationFile(root, "std/console.sg", fileSystem), null);
  assert.equal(graphify.resolveLocationFile(root, undefined, fileSystem), null);
  assert.equal(graphify.resolveLocationFile(root, onDisk, fileSystem), onDisk);
});

test("symbol pattern accepts qualified names and fields", () => {
  const word = (text) => new RegExp(`^${graphify.SYMBOL_PATTERN.source}$`).test(text);
  assert.equal(word("geometry::shift"), true);
  assert.equal(word("Point.x"), true);
  assert.equal(word("main"), true);
  assert.equal(word("1abc"), false);
});
