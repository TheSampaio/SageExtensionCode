# Extension source publication — 2026-10-25

The user confirmed `https://github.com/TheSampaio/SageExtensionCode` as the push
destination. The independent extension checkout now uses that repository as
`origin`, with publication branch `codex/sage-extension`.

The pre-existing remote `main` points to wrapper commit
`7f6476f83954fa282adf6bd216dad33600c3fdf3`. Its independent history and ignored
nested checkout are preserved. Publishing the source on a separate branch avoids
replacing that history or introducing an embedded repository/gitlink.

Patch release 0.6.2 corrects the manifest repository URL and documents where the
source lives. Runtime, grammar, commands, Test Explorer behavior, and icon theme
contributions are unchanged from 0.6.1. Prior live validation remains documented
in [resource presence integration](validation-resource-presence-2026-10-25.md).

Publication of source to GitHub is separate from a Marketplace release.
