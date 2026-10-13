# Updating the upstream version

Upstream is `janeczku/calibre-web`, packaged through the `linuxserver/calibre-web` prebuilt image pinned in `startos/manifest/index.ts` (`images.calibre-web.source.dockerTag`). Tags look like `0.6.27-ls405`: the Calibre-Web release, then linuxserver's rebuild counter.

## Determining the upstream version

- Latest Calibre-Web release: `gh release view -R janeczku/calibre-web --json tagName -q .tagName` (no `v` prefix).
- Latest image build for it: `curl -s "https://hub.docker.com/v2/repositories/linuxserver/calibre-web/tags?page_size=25" | jq -r '.results[].name'`, picking the highest `<release>-lsNNN`.
- Confirm both architectures: `docker manifest inspect linuxserver/calibre-web:<tag> | jq -r '.manifests[].platform.architecture'` must list `amd64` and `arm64`.

## Applying the bump

1. Set `images.calibre-web.source.dockerTag` in `startos/manifest/index.ts`.
2. Set the version in `startos/versions/current.ts` to `<release>:0`, and raise the revision after the colon for a rebuild of the same release. Update the release notes. Add a version file only if the release needs a migration; see `start-technologies/projects/start-sdk/docs/src/versions.md`.
3. Refresh `assets/metadata.db` from `library/metadata.db` at the new upstream tag if it changed:
   `curl -sL https://raw.githubusercontent.com/janeczku/calibre-web/<release>/library/metadata.db -o assets/metadata.db`.
4. Check that the password rules `generateAdminPassword` in `startos/utils.ts` satisfies still match `cps/helper.py` (`valid_password`), and that `cps.py -s`, `-d` and `-p` still exist (`python3 cps.py --help` in the image).
5. Rebuild with `make x86`, then `make install`, and confirm the version with `start-cli package list`. Check that the service starts, the password from **Set Admin Password** signs in, and an uploaded book survives a restart.
