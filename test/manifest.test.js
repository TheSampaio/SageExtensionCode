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
