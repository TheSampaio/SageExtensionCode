# Owned byte-file integration — 2026-10-25

Validated extension 0.7.0 with Sage 0.18.0: implementation `d0f3085` and
documentation follow-up `0f5a94c`. Used the user's existing
`D:/DevelopmentLibrary/Apps/Sage/Sandbox` VS Code window.

- JavaScript syntax checking and all 17 Node tests passed. Packaged a 13-file
  runtime VSIX (51.23 KB), verified the packaged README, installed locally,
  and reloaded the Sandbox window.
- Test Explorer completed at **177/177**: 23 file results and 154 assertions.
  The new byte-file source passed eight assertions without unsafe acquisition
  or real file writes; its empty-owner operations are safe Sage.
- Opened `tests/byte_file.test.sg` and verified real-source highlighting.
- Run Current File rejected reuse of a closed/consumed owner with `S140` at
  `(2,125)`, pointing to the move at `(2,80)`, and exited with code 1. The own
  temporary probe was closed and removed afterward.
- Sage language icons remained alongside Material Icon Theme. No icon theme or
  user theme-setting change was introduced.

Compiler Debug/Release builds had zero warnings/errors; all 19 PowerShell
regression scripts passed, with 23 Sandbox files and 154 assertions each.
Byte-file coverage includes 45 fault-injected C11 adapter checks (GCC
`-Wall -Wextra -Werror`), 18 Sage integration assertions, persisted all-byte
content/exclusive reopen, and 10 negative semantic cases. Paths containing spaces
and local std native-header resolution are covered; legacy `file` also compiles.

Documentation covers shared/mutable operations, `ByteRead` data/EOF/failure,
consuming fallible close, best-effort implicit cleanup, and the native std header.
Path acquisition remains unsafe because legacy strings have unchecked lifetime.
This does not claim a complete safe path/text/buffer API or completion of the
broader std migration. Compiler source is published on `origin/dev`; extension
source uses `origin/codex/sage-extension`, preserving the wrapper main history.
