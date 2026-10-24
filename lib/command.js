"use strict";

/** Split a configured launcher command while preserving quoted paths and arguments. */
function parseCommand(command) {
  const parts = [];
  let part = "";
  let quote = null;
  let started = false;

  for (const char of command.trim()) {
    if (quote) {
      if (char === quote) quote = null;
      else part += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (started) {
        parts.push(part);
        part = "";
        started = false;
      }
    } else {
      part += char;
      started = true;
    }
  }

  if (quote) throw new Error("Unclosed quote in sage.command.");
  if (started) parts.push(part);
  return parts.length ? parts : ["sage"];
}

module.exports = { parseCommand };
