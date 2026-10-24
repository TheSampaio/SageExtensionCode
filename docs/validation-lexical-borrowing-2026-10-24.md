# Lexical borrowing validation — 2026-10-24

Validated Sage extension 0.4.1 with compiler 0.9.1 in the user's existing
`D:/DevelopmentLibrary/Apps/Sage/Sandbox` VS Code window.

- Local `&T` and `&mut T` declarations and initializers received the borrowing
  grammar scopes. Sage file icons remained visible with Material Icon Theme;
  the extension contributes no file icon theme.
- Test Explorer completed at **106/106**: 17 file results plus 89 assertions,
  including the new lexical lifetime tests.
- Run Current File rejected a temporary program that mutated a source while a
  shared local borrow was live. Output displayed `S178`, the access location
  `(1,113)`, the borrow location `(1,99)`, and `Sage exited with code 1`.
  The temporary source was removed and the editor returned to the lifetime tests.
- Thirteen Node tests passed, including five TextMate/Oniguruma grammar tests.
  JavaScript syntax checking and VSIX packaging also passed.
- `sage-lang-0.4.1.vsix` contains 13 runtime files. Development dependencies,
  tests, and validation records are excluded. Dependency audit reported zero
  vulnerabilities.

Borrow conflict diagnostics come from invoking the compiler; this release does
not provide live semantic diagnostics. Local loans last until lexical scope exit.
Borrowed returns, fields, strings, arrays, and native resources remain outside
the compiler's supported borrowing subset; see its `docs/borrowing.md`.
