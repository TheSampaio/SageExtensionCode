"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const diagnostics = require("../lib/diagnostics");

const JSON_LINE = JSON.stringify({
  code: "S101",
  severity: "error",
  file: "main.sg",
  path: "C:\\proj\\src\\main.sg",
  line: 5,
  column: 18,
  message: "Initializer of 'x' requires 'i32', but received 'str'.",
  rule: "An initializer must have the declared variable type."
});

const OWNERSHIP_LINE = JSON.stringify({
  code: "S140",
  severity: "error",
  file: "main.sg",
  path: "C:\\proj\\src\\main.sg",
  line: 6,
  column: 10,
  message: "Owner 'f' was moved by passing it to 'take' at (5,5) and cannot be used here.",
  rule: "A moved owner cannot be used again.",
  related: [{ symbol: "f", note: "invalidated by passing it to 'take'", file: "main.sg", line: 5, column: 5 }],
  suggestion: "Use the owner before it is moved, or move it only on its last use."
});

test("parses one JSON diagnostic per line", () => {
  const [one, two] = diagnostics.parseJsonDiagnostics(`${JSON_LINE}\r\n${OWNERSHIP_LINE}\r\n`);
  assert.equal(one.code, "S101");
  assert.equal(one.path, "C:\\proj\\src\\main.sg");
  assert.equal(one.line, 5);
  assert.equal(one.column, 18);
  assert.equal(one.suggestion, undefined);
  assert.deepEqual(one.related, []);
  assert.equal(two.suggestion, "Use the owner before it is moved, or move it only on its last use.");
  assert.deepEqual(two.related, [
    { symbol: "f", note: "invalidated by passing it to 'take'", file: "main.sg", line: 5, column: 5 }
  ]);
});

test("ignores program output and JSON that is not a Sage diagnostic", () => {
  const output = [
    "[PASS] adds",
    '{"name":"json from the program"}',
    '{"code":"S101","severity":"error"',
    '{"code":"not-a-code","message":"x"}',
    "plain text",
    JSON_LINE
  ].join("\n");
  const parsed = diagnostics.parseJsonDiagnostics(output);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].code, "S101");
});

test("keeps file-less tool failures without a location", () => {
  const [failure] = diagnostics.parseJsonDiagnostics(
    JSON.stringify({ code: "S900", severity: "error", message: "gcc was not found." })
  );
  assert.equal(failure.code, "S900");
  assert.equal(failure.line, undefined);
  assert.equal(failure.file, undefined);
});

test("parses the human format and its indented continuation lines", () => {
  const output = [
    "main.sg(1,1): error S007: Module 'console' not found.",
    "   Checked:",
    "   - C:\\proj\\src\\console.sg",
    "util.sg(12,3): error S164: Native call needs unsafe.",
    "Sage exited with code 1."
  ].join("\r\n");
  const [first, second] = diagnostics.parseHumanDiagnostics(output);
  assert.equal(first.code, "S007");
  assert.equal(first.file, "main.sg");
  assert.equal(first.line, 1);
  assert.equal(first.column, 1);
  assert.equal(first.message, "Module 'console' not found.\nChecked:\n- C:\\proj\\src\\console.sg");
  assert.equal(second.message, "Native call needs unsafe.");
});

test("the human parser ignores lines that are not diagnostics", () => {
  assert.deepEqual(diagnostics.parseHumanDiagnostics("[FAIL] adds (expected 5)\nhello"), []);
});

test("parseDiagnostics prefers JSON and falls back to the human format", () => {
  assert.equal(diagnostics.parseDiagnostics(JSON_LINE)[0].path, "C:\\proj\\src\\main.sg");
  const fallback = diagnostics.parseDiagnostics("main.sg(2,4): error S105: Undefined 'y'.");
  assert.equal(fallback[0].code, "S105");
  assert.equal(fallback[0].path, undefined);
  assert.deepEqual(diagnostics.parseDiagnostics("all fine"), []);
});

test("detects compilers that support JSON diagnostics", () => {
  assert.equal(diagnostics.supportsJsonDiagnostics("Sage Compiler v0.37.3 (Alpha)"), true);
  assert.equal(diagnostics.supportsJsonDiagnostics("Sage Compiler v0.35.0"), true);
  assert.equal(diagnostics.supportsJsonDiagnostics("Sage Compiler v0.34.1"), false);
  assert.equal(diagnostics.supportsJsonDiagnostics("Sage Compiler v1.0.0"), true);
  assert.equal(diagnostics.supportsJsonDiagnostics("unexpected output"), false);
  assert.equal(diagnostics.supportsJsonDiagnostics(""), false);
});

test("chooses the diagnostics flag from the setting and the detected version", () => {
  const modern = "Sage Compiler v0.37.3 (Alpha)";
  const legacy = "Sage Compiler v0.30.0";
  assert.deepEqual(diagnostics.diagnosticsArguments("auto", modern), ["--diagnostics", "json"]);
  assert.deepEqual(diagnostics.diagnosticsArguments("auto", legacy), []);
  assert.deepEqual(diagnostics.diagnosticsArguments("auto", undefined), []);
  assert.deepEqual(diagnostics.diagnosticsArguments("human", modern), []);
  assert.deepEqual(diagnostics.diagnosticsArguments("json", legacy), ["--diagnostics", "json"]);
});

test("resolves diagnostic files from the JSON path, siblings, or the compiled file", () => {
  const compiled = path.join("C:", "proj", "src", "main.sg");
  const sibling = path.join("C:", "proj", "src", "util.sg");
  const fileSystem = {
    exists: (candidate) => candidate === sibling,
    dirname: path.dirname,
    join: path.join
  };
  assert.equal(diagnostics.resolveDiagnosticFile({ path: "D:\\x\\a.sg", file: "a.sg" }, compiled, fileSystem), "D:\\x\\a.sg");
  assert.equal(diagnostics.resolveDiagnosticFile({ file: "util.sg" }, compiled, fileSystem), sibling);
  assert.equal(diagnostics.resolveDiagnosticFile({ file: "std_module.sg" }, compiled, fileSystem), compiled);
  assert.equal(diagnostics.resolveDiagnosticFile({}, compiled, fileSystem), compiled);
});

test("groups diagnostics by file in compiler order", () => {
  const fileSystem = { exists: () => false, dirname: path.dirname, join: path.join };
  const groups = diagnostics.groupByFile(
    [{ code: "S1", path: "a.sg" }, { code: "S2", path: "b.sg" }, { code: "S3", path: "a.sg" }],
    "main.sg",
    fileSystem
  );
  assert.deepEqual([...groups.keys()], ["a.sg", "b.sg"]);
  assert.deepEqual(groups.get("a.sg").map((entry) => entry.code), ["S1", "S3"]);
});

test("formats diagnostics like the compiler's human output", () => {
  const [one] = diagnostics.parseJsonDiagnostics(JSON_LINE);
  assert.equal(
    diagnostics.formatHuman(one),
    "main.sg(5,18): error S101: Initializer of 'x' requires 'i32', but received 'str'."
  );
  assert.equal(diagnostics.formatHuman({ severity: "error", code: "S900", message: "boom" }), "error S900: boom");
});

test("adds only reliable suggestions to the Problems message", () => {
  const [plain, withSuggestion] = diagnostics.parseJsonDiagnostics(`${JSON_LINE}\n${OWNERSHIP_LINE}`);
  assert.equal(diagnostics.problemMessage(plain), plain.message);
  assert.match(diagnostics.problemMessage(withSuggestion), /\nSuggestion: Use the owner before it is moved/);
});

test("humanizes JSON lines in output while keeping program output", () => {
  const output = `hello\n${JSON_LINE}\n${OWNERSHIP_LINE}\n[PASS] ok`;
  const lines = diagnostics.humanizeOutput(output).split("\n");
  assert.equal(lines[0], "hello");
  assert.equal(lines[1], "main.sg(5,18): error S101: Initializer of 'x' requires 'i32', but received 'str'.");
  assert.match(lines[2], /^main\.sg\(6,10\): error S140: /);
  assert.equal(lines[3], "  Suggestion: Use the owner before it is moved, or move it only on its last use.");
  assert.equal(lines[4], "[PASS] ok");
});
