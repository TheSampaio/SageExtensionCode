# Safe resource presence integration — 2026-10-25

Validated extension 0.6.1 with compiler 0.17.0 (`7bd60e1`) in the user's existing
`D:/DevelopmentLibrary/Apps/Sage/Sandbox` VS Code window.

- JavaScript syntax checking and all 17 Node tests passed. The added TextMate
  check covers contextual null comparisons. Packaged a 13-file runtime VSIX
  (50.37 KB), installed locally, and reloaded the Sandbox window.
- Test Explorer completed at **168/168**: 22 file results and 146 assertions.
  The native resource file passed all 11 assertions; its shared presence helper
  now uses pure safe Sage instead of raw pointer exposure.
- The real editor displayed contextual null comparisons correctly.
- Run Current File displayed `S195` at `(3,77)` for an ordered resource/null
  comparison, explained the supported equality/inequality contract, and exited
  with code 1. The temporary probe was closed and removed afterward.
- Sage language icons remained alongside Material Icon Theme. No icon theme
  contribution or user theme-setting change was introduced.

Compiler Debug/Release builds and all 18 PowerShell regression scripts passed,
with 22 Sandbox files and 146 assertions each. Resource coverage includes 24
presence cases plus a minimal-header/AST check, 66 native runtime assertions,
31 ownership cases, 32 consuming parameter cases, 23 return cases, 33 borrow
cases, and 31 declaration cases, including the existing minimal-header checks.

The compiler was pushed normally to `origin/dev`; its remote hash was confirmed
as `7bd60e1571ec3e625f10447dc5009b5c46c7d391`. Extension publication is separate:
its independent checkout has no configured remote, and the manifest repository
URL returned "Repository not found". The outer `SageExtensionCode` checkout is a
wrapper with an independent history; the nested extension must not become a
gitlink or overwrite that wrapper's main. Push destination awaits the user's
choice, while the local installed VSIX and committed source remain available.
