# Local native resource integration — 2026-10-25

Validated extension 0.5.1 with compiler 0.13.0 (`47e9b9d`) in the user's existing
`D:/DevelopmentLibrary/Apps/Sage/Sandbox` VS Code window.

- JavaScript syntax checking and all 16 Node tests passed. Packaged a 13-file
  runtime VSIX (49.13 KB), installed locally, and reloaded the Sandbox window.
- Test Explorer completed at **160/160**: 22 file results and 138 assertions,
  including the new native resource test file and its three assertions.
- Run Current File displayed `S192` at `(2,41)` for anonymous resource adoption,
  explained the unsafe/direct-local-owner requirement, and reported exit code 1.
  The temporary file was closed and removed afterward.
- Native resource declaration highlighting remained correct. Sage language icons
  coexisted with Material Icon Theme, with no contributed icon theme or changes
  to user theme settings.

Compiler Debug/Release builds and all 14 PowerShell regression scripts passed.
The native ownership fixture checks 25 runtime assertions and 31 semantic cases,
plus a minimal-header check; declaration contracts have another 31 cases.
The Sandbox passed 22 files and 138 assertions in each configuration.

Documentation covers direct unsafe adoption, moves, nullable automatic cleanup,
trusted raw aliases, and single-attempt cleanup that discards integer destructor
status. Resource borrows, value parameters/returns, fields, arrays, and safe file
APIs remain disabled in compiler 0.13.0.
