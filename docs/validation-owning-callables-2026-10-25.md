# Owning resource call integration — 2026-10-25

Validated extension 0.6.0 with compiler 0.16.0 (`96ba1d1`, following the 0.15.0
return increment `d8f6340`) in the user's existing
`D:/DevelopmentLibrary/Apps/Sage/Sandbox` VS Code window.

- JavaScript syntax checking and all 16 Node tests passed. Packaged a 13-file
  runtime VSIX (50.05 KB), installed locally, and reloaded the Sandbox window.
- Test Explorer completed at **166/166**: 22 file results and 144 assertions.
  The native resource file includes nine assertions, covering owning factory
  returns and consuming/returning parameters in addition to existing loans.
- Run Current File displayed `S194` at `(4,29)` for passing an anonymous producer
  to a consuming parameter. The message required a named local owner and binding
  the producer before the call; the compiler exited with code 1.
- A second Run Current File displayed `S193` at `(3,21)` for discarding an owning
  result. The message required direct local ownership; the compiler exited 1.
  Both temporary probes were closed and removed afterward.
- Sage language icons remained alongside Material Icon Theme. No file icon theme
  contribution or user theme-setting change was introduced.

Compiler Debug/Release builds and all 17 PowerShell regression scripts passed,
with 22 Sandbox files and 144 assertions in each configuration. Resource coverage:
32 consuming parameter cases and a minimal-header check, 23 return cases, 58
native runtime assertions plus 31 ownership cases/minimal-header check, 33 borrow
cases, and 31 declaration cases. The new suites initially failed on the preceding
compiler versions before their respective implementations.

Documentation explains caller invalidation, callee cleanup, local/parameter
destruction order, direct producer binding, and same-call ownership/borrow or
effectful-argument conflicts. Unsafe native validity, exclusivity, destructor,
and alias obligations remain trusted. General owning temporaries, resource
aggregates/globals, and safe file APIs remain outside this increment.
