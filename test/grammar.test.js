"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const textmate = require("vscode-textmate");
const oniguruma = require("vscode-oniguruma");
let grammar;

test.before(async () => {
  const wasm = fs.readFileSync(require.resolve("vscode-oniguruma/release/onig.wasm"));
  await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
  const grammarPath = path.join(__dirname, "../syntaxes/sage.tmLanguage.json");
  const registry = new textmate.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
      createOnigString: (text) => new oniguruma.OnigString(text)
    }),
    loadGrammar: async (scope) => scope === "source.sg"
      ? textmate.parseRawGrammar(fs.readFileSync(grammarPath, "utf8"), grammarPath)
      : null
  });
  grammar = await registry.loadGrammar("source.sg");
  assert.ok(grammar);
});

function scopesAt(line, needle) {
  const offset = line.indexOf(needle);
  assert.notEqual(offset, -1);
  return grammar.tokenizeLine(line, textmate.INITIAL).tokens
    .find((token) => token.startIndex <= offset && token.endIndex > offset).scopes;
}

test("tokenizes imported module names with the real VS Code regex engine", () => {
  assert.ok(scopesAt("use console;", "console").includes("entity.name.namespace.sage"));
});

test("highlights an explicit mutable borrow", () => {
  const line = "func update(value: &mut Counter): none";
  assert.ok(scopesAt(line, "&").includes("keyword.operator.borrow.sage"));
  assert.ok(scopesAt(line, "mut").includes("storage.modifier.borrow.sage"));
});

test("keeps mut contextual and distinguishes logical and from borrowing", () => {
  assert.ok(scopesAt("var mut: i32 = 1;", "mut").includes("variable.other.sage"));
  assert.ok(!scopesAt("var both: b8 = true && false;", "&&").includes("keyword.operator.borrow.sage"));
});

test("does not parse borrowing inside strings and comments", () => {
  assert.ok(scopesAt('var text: str = "&mut value";', "&").includes("string.quoted.double.sage"));
  assert.ok(scopesAt("// &mut value", "&").includes("comment.line.double-slash.sage"));
});
