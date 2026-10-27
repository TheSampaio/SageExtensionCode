"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { findProjectRoot, entryFile } = require("../lib/project");

function fileSystemWith(...files) {
  const known = new Set(files.map((file) => path.normalize(file)));
  return { exists: (candidate) => known.has(path.normalize(candidate)), dirname: path.dirname, join: path.join };
}

const root = path.resolve(path.sep, "work", "app");
const entry = path.join(root, "src", "main.sg");

test("finds the project root from a module in src", () => {
  assert.equal(findProjectRoot(path.join(root, "src", "util.sg"), fileSystemWith(entry)), root);
});

test("finds the project root from a nested directory and from the root itself", () => {
  const fileSystem = fileSystemWith(entry);
  assert.equal(findProjectRoot(path.join(root, "src", "deep", "x.sg"), fileSystem), root);
  assert.equal(findProjectRoot(root, fileSystem), root);
});

test("prefers the nearest project when projects are nested", () => {
  const inner = path.join(root, "examples", "demo");
  const fileSystem = fileSystemWith(entry, path.join(inner, "src", "main.sg"));
  assert.equal(findProjectRoot(path.join(inner, "src", "a.sg"), fileSystem), inner);
});

test("returns null outside a project", () => {
  assert.equal(findProjectRoot(path.join(root, "src", "util.sg"), fileSystemWith()), null);
});

test("builds the entry file path", () => {
  assert.equal(entryFile(root, path.join), entry);
});
