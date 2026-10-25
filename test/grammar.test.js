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

test("tokenizes borrowed local bindings and their initializers", () => {
  const line = "var view: &mut Counter = &mut owner;";
  const tokens = grammar.tokenizeLine(line, textmate.INITIAL).tokens;
  assert.equal(tokens.filter((token) => token.scopes.includes("keyword.operator.borrow.sage")).length, 2);
  assert.equal(tokens.filter((token) => token.scopes.includes("storage.modifier.borrow.sage")).length, 2);
  assert.ok(scopesAt(line, "view").includes("variable.other.sage"));
});

test("keeps mut contextual and distinguishes logical and from borrowing", () => {
  assert.ok(scopesAt("var mut: i32 = 1;", "mut").includes("variable.other.sage"));
  assert.ok(!scopesAt("var both: b8 = true && false;", "&&").includes("keyword.operator.borrow.sage"));
});

test("does not parse borrowing inside strings and comments", () => {
  assert.ok(scopesAt('var text: str = "&mut value";', "&").includes("string.quoted.double.sage"));
  assert.ok(scopesAt("// &mut value", "&").includes("comment.line.double-slash.sage"));
});

test("highlights a contextual native resource declaration", () => {
  const line = "resource OwnedFile: FILE* drop fclose;";
  assert.ok(scopesAt(line, "resource").includes("keyword.other.resource.sage"));
  assert.ok(scopesAt(line, "OwnedFile").includes("entity.name.type.resource.sage"));
  assert.ok(scopesAt(line, "FILE").includes("entity.name.type.native.sage"));
  assert.ok(scopesAt(line, "drop").includes("keyword.other.resource.sage"));
  assert.ok(scopesAt(line, "fclose").includes("entity.name.function.destructor.sage"));
});

test("keeps resource declaration scopes across lines and ends at the semicolon", () => {
  let state = textmate.INITIAL;
  const lines = ["resource OwnedFile:", "    FILE*", "    drop", "    fclose;", "var drop: i32 = 1;"];
  const tokens = lines.map((line) => {
    const result = grammar.tokenizeLine(line, state);
    state = result.ruleStack;
    return result.tokens;
  });
  assert.ok(tokens[1].some((token) => token.scopes.includes("entity.name.type.native.sage")));
  assert.ok(tokens[2].some((token) => token.scopes.includes("keyword.other.resource.sage")));
  assert.ok(tokens[3].some((token) => token.scopes.includes("entity.name.function.destructor.sage")));
  assert.ok(!tokens[4].some((token) => token.scopes.includes("meta.declaration.resource.sage")));
});

test("keeps resource words ordinary outside declarations and ignores quoted or commented declarations", () => {
  assert.ok(scopesAt("var resource: i32 = 1;", "resource").includes("variable.other.sage"));
  assert.ok(scopesAt("var drop: i32 = 1;", "drop").includes("variable.other.sage"));
  assert.ok(scopesAt('var text: str = "resource OwnedFile: FILE* drop fclose;";', "resource").includes("string.quoted.double.sage"));
  assert.ok(scopesAt("// resource OwnedFile: FILE* drop fclose;", "resource").includes("comment.line.double-slash.sage"));
});
