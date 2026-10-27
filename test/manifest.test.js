"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("contributes a language icon without replacing the active file icon theme", () => {
  const root = path.join(__dirname, "..");
  const manifest = require("../package.json");
  const language = manifest.contributes.languages.find((entry) => entry.id === "sage");

  assert.equal(manifest.contributes.iconThemes, undefined);
  assert.deepEqual(language.extensions, [".sg"]);
  assert.ok(fs.existsSync(path.join(root, language.icon.light)));
  assert.ok(fs.existsSync(path.join(root, language.icon.dark)));
});

test("uses the command category as the only Sage prefix", () => {
  const command = require("../package.json").contributes.commands.find((entry) => entry.command === "sage.runFile");
  assert.equal(command.category, "Sage");
  assert.equal(command.title, "Run Current File");
});

test("does not contribute icon themes, product icon themes or file icon associations", () => {
  const contributes = require("../package.json").contributes;
  assert.equal(contributes.iconThemes, undefined);
  assert.equal(contributes.productIconThemes, undefined);
  assert.equal(contributes.themes, undefined);
  assert.equal(contributes.configurationDefaults, undefined);
});

test("runs every test file listed in the test script", () => {
  const listed = require("../package.json").scripts.test.split(/\s+/).filter((part) => part.endsWith(".test.js"));
  const present = fs.readdirSync(__dirname).filter((name) => name.endsWith(".test.js")).map((name) => `test/${name}`);
  assert.deepEqual([...listed].sort(), present.sort());
});

test("contributes a problem matcher for the compiler's human diagnostics format", () => {
  const matcher = require("../package.json").contributes.problemMatchers.find((entry) => entry.name === "sage");
  assert.equal(matcher.owner, "sage");
  const pattern = matcher.pattern;
  const match = new RegExp(pattern.regexp).exec("main.sg(5,18): error S101: Initializer of 'x' requires 'i32'.");
  assert.ok(match);
  assert.equal(match[pattern.file], "main.sg");
  assert.equal(match[pattern.line], "5");
  assert.equal(match[pattern.column], "18");
  assert.equal(match[pattern.severity], "error");
  assert.equal(match[pattern.code], "S101");
  assert.equal(match[pattern.message], "Initializer of 'x' requires 'i32'.");
  assert.equal(new RegExp(pattern.regexp).exec("[PASS] adds"), null);
});

test("declares the diagnostics format setting with auto as default", () => {
  const setting = require("../package.json").contributes.configuration.properties["sage.diagnosticsFormat"];
  assert.equal(setting.default, "auto");
  assert.deepEqual(setting.enum, ["auto", "json", "human"]);
  assert.equal(setting.enumDescriptions.length, setting.enum.length);
});
