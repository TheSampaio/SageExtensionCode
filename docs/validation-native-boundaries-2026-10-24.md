# Native boundary integration — 2026-10-24

Validated extension 0.4.3 with compiler 0.11.0 (`5efc250`) in the user's existing
`D:/DevelopmentLibrary/Apps/Sage/Sandbox` VS Code window.

- JavaScript syntax checking and all 13 Node tests passed. Packaged a 13-file
  runtime VSIX (48.05 KB), installed it locally, and reloaded the Sandbox window.
- Test Explorer completed at **156/156**: 21 file results and 135 assertions,
  including all three native-wrapper assertions and the `i32` minimum case.
- Run Current File displayed `S164` at `(1,95)` for an unguarded native `abs` call,
  identified `native::abs`, required an unsafe context, and reported exit code 1.
  The temporary source was removed afterward.
- Sage language icons remained visible alongside Material Icon Theme icons.
  No file icon theme or user theme-setting change was introduced.

The release documents unsafe native call migration, legacy input/HTTP boundaries,
and S146/S164 diagnostics. Runtime protocols and syntax highlighting already
support the compiler contracts; no live semantic service is claimed.

Compiler Debug/Release builds and full regressions passed (21 Sandbox files and
135 assertions in each). Native boundary tests include 19 positive/negative cases.
File, memory, server, and HTTP modules also compiled and linked in both; only an
empty main ran, so no network, shell, or input helpers were invoked.
