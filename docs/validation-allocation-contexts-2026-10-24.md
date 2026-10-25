# Allocation ownership integration — 2026-10-24

Validated installed extension 0.4.2 with compiler 0.10.1 (commit `2a1f513`) in
the user's existing Sandbox VS Code window.

- Test Explorer completed at **152/152**: 20 file results plus 132 assertions.
  The added ownership assertion returns a copied field before local owner cleanup.
- Run Current File rejected an anonymous `new` field projection with `S146` at
  `(1,64)`, explained that allocation must directly initialize a local owning
  binding, and reported exit code 1. The temporary probe was removed afterward.
- Sage icons continued to coexist with Material Icon Theme. No extension runtime
  or grammar change was required for this compiler correction.
- Debug and Release builds passed with zero warnings/errors. Both complete
  regressions passed, including 20 allocation-context cases, 25 native cleanup
  assertions, and 20 Sandbox programs with 132 assertions.

The compiler previously accepted the anonymous projection. A native allocation
tracker confirmed one unreleased allocation after the containing function
returned. The corrected compiler rejects it before C generation; naming the owner
preserves the projected value and releases its allocation at scope exit.
