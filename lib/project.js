"use strict";

/** Entry point that marks a Sage project root: `<root>/src/main.sg`. */
const ENTRY = ["src", "main.sg"];

/**
 * Finds the Sage project that contains `startPath` by walking up to the nearest directory with a
 * `src/main.sg`. Returns null when `startPath` is outside any project.
 *
 * @param {string} startPath  A file or directory.
 * @param {{exists: (candidate: string) => boolean, dirname: (value: string) => string, join: (...parts: string[]) => string}} fileSystem
 */
function findProjectRoot(startPath, fileSystem) {
  let directory = startPath;
  for (;;) {
    if (fileSystem.exists(fileSystem.join(directory, ...ENTRY))) return directory;
    const parent = fileSystem.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

/** Absolute path of a project's entry file. */
function entryFile(root, join) {
  return join(root, ...ENTRY);
}

module.exports = { findProjectRoot, entryFile };
