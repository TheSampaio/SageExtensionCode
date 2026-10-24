"use strict";

const PASS_RE = /^\s*\[PASS\]\s+(.+?)\s*$/;
const FAIL_RE = /^\s*\[FAIL\]\s+(.+?)\s*$/;

/** Parse the assertion markers emitted by Sage's test standard-library module. */
function parseResults(output) {
  const results = [];
  for (const line of output.split(/\r?\n/)) {
    let match = PASS_RE.exec(line);
    if (match) {
      results.push({ name: match[1], passed: true, detail: "" });
      continue;
    }
    match = FAIL_RE.exec(line);
    if (match) {
      const raw = match[1];
      const paren = raw.indexOf(" (");
      const name = paren >= 0 ? raw.slice(0, paren) : raw;
      const detail = paren >= 0
        ? raw.slice(paren + 2, raw.endsWith(")") ? -1 : undefined)
        : "";
      results.push({ name, passed: false, detail });
    }
  }
  return results;
}

module.exports = { parseResults };
