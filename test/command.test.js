"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCommand } = require("../lib/command");

test("parses an executable path with spaces", () => {
  assert.deepEqual(parseCommand('"C:\\Program Files\\Sage\\sage.exe"'), [
    "C:\\Program Files\\Sage\\sage.exe"
  ]);
});

test("parses a launcher and quoted DLL path", () => {
  assert.deepEqual(parseCommand('dotnet "C:/My Tools/Sage.dll"'), [
    "dotnet", "C:/My Tools/Sage.dll"
  ]);
});

test("defaults to the sage command for blank input", () => {
  assert.deepEqual(parseCommand("  "), ["sage"]);
});

test("rejects an unclosed quote", () => {
  assert.throws(() => parseCommand('dotnet "C:/My Tools/Sage.dll'), /Unclosed quote/);
});
