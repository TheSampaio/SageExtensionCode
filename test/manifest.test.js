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

test("registers every contributed command with the Sage category and no title prefix", () => {
  const commands = require("../package.json").contributes.commands;
  for (const command of commands) {
    assert.equal(command.category, "Sage", command.command);
    assert.ok(!command.title.startsWith("Sage"), command.title);
    assert.match(command.command, /^sage\.[A-Za-z.]+$/);
  }
  const ids = commands.map((command) => command.command);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes("sage.buildProject"));
  assert.ok(ids.includes("sage.cleanBuild"));
});

test("declares the clean-before-run setting as off by default", () => {
  const setting = require("../package.json").contributes.configuration.properties["sage.cleanBeforeRun"];
  assert.equal(setting.type, "boolean");
  assert.equal(setting.default, false);
});

test("every contributed command is registered by the extension code and vice versa", () => {
  const root = path.join(__dirname, "..");
  const sources = ["extension.js", ...fs.readdirSync(path.join(root, "commands")).map((name) => `commands/${name}`)];
  const text = sources.map((source) => fs.readFileSync(path.join(root, source), "utf8")).join("\n");
  const registered = [...text.matchAll(/"(sage\.[A-Za-z.]+)"/g)].map((match) => match[1]);
  const contributed = require("../package.json").contributes.commands.map((command) => command.command);
  for (const id of contributed) assert.ok(registered.includes(id), `${id} is not registered`);
  for (const id of new Set(registered)) assert.ok(contributed.includes(id), `${id} is not contributed`);
});

test("contributes the Graphify commands", () => {
  const ids = require("../package.json").contributes.commands.map((command) => command.command);
  for (const id of ["build", "query", "symbol", "callers", "contract"]) {
    assert.ok(ids.includes(`sage.graphify.${id}`), id);
  }
});

test("documents the packaged version in the changelog and keeps repository metadata", () => {
  const root = path.join(__dirname, "..");
  const manifest = require("../package.json");
  const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  assert.ok(changelog.includes(`## [${manifest.version}]`), `CHANGELOG has no entry for ${manifest.version}`);
  assert.equal(require("../package-lock.json").version, manifest.version);
  assert.equal(manifest.license, "MIT");
  assert.equal(manifest.repository.url, "https://github.com/TheSampaio/SageExtensionCode.git");
  assert.ok(fs.existsSync(path.join(root, "LICENSE")));
});

test("documents every command and setting in the README", () => {
  const readme = fs.readFileSync(path.join(__dirname, "../README.md"), "utf8");
  const contributes = require("../package.json").contributes;
  for (const command of contributes.commands) {
    assert.ok(readme.includes(`\`Sage: ${command.title}\``), `README does not document ${command.title}`);
  }
  for (const setting of Object.keys(contributes.configuration.properties)) {
    assert.ok(readme.includes(`\`${setting}\``), `README does not document ${setting}`);
  }
  assert.ok(readme.includes("Material Icon Theme"));
});
