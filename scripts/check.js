"use strict";

// Syntax-checks every JavaScript file of the extension with `node --check`.

const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const DIRECTORIES = ["", "host", "lib", "scripts", "test", path.join("test", "support")];

function javascriptFiles() {
  return DIRECTORIES.flatMap((directory) =>
    fs
      .readdirSync(path.join(ROOT, directory), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
      .map((entry) => path.join(ROOT, directory, entry.name))
  );
}

let failed = 0;
for (const file of javascriptFiles()) {
  const result = cp.spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    failed++;
    process.stderr.write(result.stderr);
  }
}

if (failed > 0) {
  process.stderr.write(`${failed} file(s) failed the syntax check.\n`);
  process.exit(1);
}
console.log("All JavaScript files passed the syntax check.");
