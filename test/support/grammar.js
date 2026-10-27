"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const textmate = require("vscode-textmate");
const oniguruma = require("vscode-oniguruma");

const GRAMMAR_PATH = path.join(__dirname, "../../syntaxes/sage.tmLanguage.json");

/** Loads the Sage grammar with the same Oniguruma engine VS Code uses. */
async function loadSageGrammar() {
  const wasm = fs.readFileSync(require.resolve("vscode-oniguruma/release/onig.wasm"));
  await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
  const registry = new textmate.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
      createOnigString: (text) => new oniguruma.OnigString(text)
    }),
    loadGrammar: async (scope) => scope === "source.sg"
      ? textmate.parseRawGrammar(fs.readFileSync(GRAMMAR_PATH, "utf8"), GRAMMAR_PATH)
      : null
  });
  const grammar = await registry.loadGrammar("source.sg");
  assert.ok(grammar);
  return grammar;
}

/** Tokenizes consecutive lines, carrying the rule stack between them. */
function tokenizeLines(grammar, lines) {
  let state = textmate.INITIAL;
  return lines.map((line) => {
    const result = grammar.tokenizeLine(line, state);
    state = result.ruleStack;
    return { line, tokens: result.tokens };
  });
}

/** Returns the scope list of the token covering the first occurrence of `needle` in `lines[row]`. */
function scopesInLines(grammar, lines, row, needle) {
  const { line, tokens } = tokenizeLines(grammar, lines)[row];
  const offset = line.indexOf(needle);
  assert.notEqual(offset, -1, `'${needle}' not found in '${line}'`);
  return tokens.find((token) => token.startIndex <= offset && token.endIndex > offset).scopes;
}

module.exports = { loadSageGrammar, tokenizeLines, scopesInLines };
