# Native resource borrow integration — 2026-10-25

Validated extension 0.5.2 with compiler 0.14.0 (`cd68e06`) in the user's existing
`D:/DevelopmentLibrary/Apps/Sage/Sandbox` VS Code window.

- JavaScript syntax checking and all 16 Node tests passed. Packaged a 13-file
  runtime VSIX (49.5 KB), installed locally, and reloaded the Sandbox window.
- Test Explorer completed at **163/163**: 22 file results and 141 assertions.
  The native resource file passed all six assertions, including shared/mutable
  borrowed calls and movement after the loan's scope ends.
- Opened the real test source and verified resource and borrow highlighting.
- Run Current File displayed `S191` at `(2,62)` for trying to move a borrowed
  resource into a new owning local. The message stated that ownership remains
  with the source; the compiler exited with code 1. The probe was closed and
  removed afterward.
- Sage language icons remained alongside Material Icon Theme. No file icon theme
  contribution or user theme-setting change was introduced.

Compiler Debug/Release builds and all 15 PowerShell regression scripts passed,
with 22 Sandbox files and 141 assertions in each configuration. Resource coverage
includes 33 borrowing cases, 32 native runtime assertions and 31 ownership cases
plus a minimal-header check, and 31 declaration contract cases.

Resource borrows preserve ownership and reuse lexical loan checks. Unsafe native
wrapper internals still carry validity, alias lifetime, and shared/mutable access
obligations. Owning value parameters/returns, fields, arrays, and safe file APIs
remain future work.
