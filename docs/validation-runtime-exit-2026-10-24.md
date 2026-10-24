# Native exit status integration — 2026-10-24

Validated installed extension 0.4.1 with compiler 0.9.3 in the existing Sandbox
VS Code window. A temporary `.test.sg` program called native `exit(37)` after
successful compilation. Test Explorer marked its file **Errored** and exposed
`Sage exited with code 37.` as the test message. The ordinary suite passed; the
temporary run therefore showed 118/119 as expected.

The probe was removed after inspection and the ordinary suite was rerun. No
extension runtime change was needed: its existing nonzero-process check now
receives the actual native application's status.

Compiler tests independently verify explicit-file execution and `run` returning
37, build-only returning zero without executing that application, successful
execution returning zero, and compile errors returning nonzero. Debug and Release
builds and all 18 ordinary Sandbox programs (100 assertions) passed.
