# Fixed-array bounds integration — 2026-10-24

Validated installed extension 0.4.1 with compiler 0.9.4 in the user's existing
Sandbox VS Code window. Test Explorer discovered `array_bounds.test.sg` and its
11 assertions for indexed reads, writes, increments, const arrays, parameter
access, nested arrays, and single evaluation of side effects.

A temporary `.test.sg` program indexed `i32[2]` using a variable containing 2.
Test Explorer marked the file **Errored** and exposed:

```text
Sage runtime error S186: Array index is outside [0,2) at (1,67).
```

The diagnostic run showed 130/131 (130 ordinary passing results and the expected
runtime failure). The probe was then removed and the ordinary suite rerun at
**130/130** (19 file results plus 111 assertions). No
extension runtime or grammar change was necessary. Sage language icons continued
to coexist with Material Icon Theme.

Compiler Debug and Release builds had zero warnings/errors. Both configurations
passed 19 bounds cases, all other regression scripts, and 19 Sandbox programs with
111 assertions. Bounds tests distinguish semantic rejection before C generation
from native runtime failure with exit status 1.

The installed GCC 15.2.0 could not link an AddressSanitizer probe (`cannot find
-lasan`). ASan validation is unavailable in this toolchain; native execution and
the existing instrumented cleanup fixture were used. Checked indexing does not
establish complete ownership or native ABI safety; see compiler `docs/array-bounds.md`.
