# AGENTS.md

- `appUid` in `startos/utils.ts` is both the `PUID`/`PGID` the daemon runs as and the owner `seedLibrary` gives `/books` and `app.db`. Change it in that one place or the library becomes read-only to the app.
- The library path and uploads setting in `app.db` are written once, at install, by `startos/init/seedLibrary.ts`. Don't re-assert them from `main.ts`: they belong to the user afterwards.
- `assets/metadata.db` is upstream's empty library, copied from its repo at the pinned release; refresh it in the same change as an image bump.
- `dataMounts(libraryPath)` in `startos/utils.ts` is the one place that decides what `/books` is: the `books` volume or a NextExplorer folder. Build every subcontainer that touches the library from it. The NextExplorer mounts in the actions are undeclared on purpose, since the dependency is needed only while an action runs.
