# Copy capabilities integration — 2026-10-24

Validated extension 0.4.2 with compiler 0.10.0 in the user's existing
`D:/DevelopmentLibrary/Apps/Sage/Sandbox` VS Code window.

- JavaScript syntax checking and all 13 Node tests passed. The tests include real
  TextMate/Oniguruma tokenization and a manifest check forbidding an icon theme.
- Packaged `sage-lang-0.4.2.vsix` with 13 runtime files (47.49 KB), installed it
  locally, and reloaded the existing Sandbox window.
- Test Explorer completed at **151/151**: 20 file results and 131 assertions,
  including all 20 array-copy assertions. The compiler's Debug/Release regression
  validation is recorded with compiler commit `f24e808`.
- Run Current File rejected a temporary source indexing an array field of a
  returned struct. Output displayed `S189` at `(1,127)`, the instruction to bind
  the containing value locally, and `Sage exited with code 1`.
  The temporary source was removed after inspection.
- Sage language icons remained visible with Material Icon Theme. No extension
  icon theme or user theme-setting mutation was introduced.

This patch documents fixed-array value copies, borrowed structs with copyable
array fields, and compiler/runtime diagnostics. Syntax and execution protocols
remain compatible; live semantic diagnostics, direct array borrows, owned
strings, and native resource contracts remain outside this release's guarantees.
