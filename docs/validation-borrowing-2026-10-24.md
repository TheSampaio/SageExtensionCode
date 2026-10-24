# Borrowing validation — 2026-10-24

Validated Sage extension 0.4.0 with compiler 0.9.0 in the user's existing
`D:/DevelopmentLibrary/Apps/Sage/Sandbox` VS Code window.

- The installed extension highlighted `&mut` in parameter and argument positions
  in `tests/borrowing.test.sg`; namespace names in `use` statements also received
  the namespace scope. Sage file icons remained visible with Material Icon Theme.
- Test Explorer discovered 16 files and completed at **98/98**: 16 file results
  plus 82 assertions. The new borrowing and function-contract programs passed.
- A temporary source passed mutable and shared borrows of the same value to one
  call. Run Current File displayed `S172`, both borrow locations, and exit code 1.
  The source was removed after the check.
- Twelve Node tests passed, including four grammar tests using TextMate and
  Oniguruma. They check contextual `mut`, logical `&&`, namespaces, strings,
  and comments. JavaScript syntax checks and VSIX generation passed.
- The VSIX contains 13 runtime files; test engines, development dependencies,
  tests, and validation records are excluded. Dependency installation reported
  zero vulnerabilities.

The extension provides syntax and execution integration. Lifetime and borrowing
checks run in the compiler when it is invoked; no live semantic provider is
claimed. Borrowing remains limited to the supported call-duration value types
documented by the compiler.
