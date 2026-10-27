"use strict";

const cp = require("node:child_process");

/**
 * Runs a program to completion and never rejects. Failures to launch are reported through
 * `code: -1` and a readable message in `output`, matching how the extension surfaces them.
 *
 * @param {string} program
 * @param {string[]} args
 * @param {{cwd?: string, timeoutMs?: number}} [options]
 * @returns {Promise<{stdout: string, stderr: string, output: string, code: number}>}
 */
function runProcess(program, args, options = {}) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let output = "";
    let settled = false;
    let timer;

    const finish = (code, extra = "") => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve({ stdout, stderr, output: extra ? `${output}\n${extra}` : output, code });
    };

    let proc;
    try {
      proc = cp.spawn(program, args, { cwd: options.cwd, windowsHide: true });
    } catch (err) {
      finish(-1, `Failed to launch Sage compiler ('${program}'): ${err.message}`);
      return;
    }

    if (options.timeoutMs) {
      timer = setTimeout(() => {
        proc.kill();
        finish(-1, `'${program}' did not finish within ${options.timeoutMs} ms.`);
      }, options.timeoutMs);
    }

    proc.stdout.on("data", (chunk) => {
      stdout += chunk;
      output += chunk;
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk;
      output += chunk;
    });
    proc.on("error", (err) => finish(-1, `Failed to launch Sage compiler ('${program}'): ${err.message}`));
    proc.on("close", (code) => finish(code ?? -1));
  });
}

module.exports = { runProcess };
