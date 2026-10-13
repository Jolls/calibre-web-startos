import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  appUid,
  dataMounts,
  isNextExplorerInstalled,
  nextexplorerMounts,
  validLibraryFolder,
} from '../utils'

const { InputSpec, Value, Variants } = sdk

// The library being left is at $CURRENT, the one being adopted at $TARGET. An
// empty NextExplorer folder receives a copy of the current library; a folder
// that already holds a Calibre library is used as it is. Every check runs on a
// copy of its metadata.db. Exit codes: 10 no library to use, 12 failed database
// check, 13 book files missing, 14 folder holds other files, 16 no such
// NextExplorer location.
const switchScript = `set -eu
if [ -n "$FOLDER" ]; then
  [ -d "/import/\${FOLDER%%/*}" ] || exit 16
  TARGET="/import/$FOLDER"
  if [ ! -f "$TARGET/metadata.db" ]; then
    if [ -d "$TARGET" ] && [ -n "$(ls -A "$TARGET")" ]; then exit 14; fi
    mkdir -p "$TARGET"
    cp -a --reflink=auto "$CURRENT/." "$TARGET/"
  fi
else
  TARGET=/books
fi
[ -f "$TARGET/metadata.db" ] || exit 10
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cp "$TARGET/metadata.db" "$TMP/metadata.db"
cd "$TMP"
[ "$(sqlite3 metadata.db 'pragma integrity_check')" = ok ] || exit 12
[ "$(sqlite3 metadata.db "select count(*) from sqlite_master where type = 'table' and name in ('books', 'authors', 'data', 'library_id')")" = 4 ] || exit 12
cd "$TARGET"
missing=$(sqlite3 "$TMP/metadata.db" "select books.path || '/' || data.name || '.' || lower(data.format) from data join books on books.id = data.book" | while IFS= read -r f; do [ -f "$f" ] || printf '%s\\n' "$f"; done)
if [ -n "$missing" ]; then
  echo "$missing" | wc -l >&2
  echo "$missing" | head -n 3 >&2
  exit 13
fi
if [ -n "$FOLDER" ]; then chown -R ${appUid}:${appUid} "$TARGET"; fi
NEWID=$(sqlite3 "$TMP/metadata.db" 'select uuid from library_id')
OLDID=$(sqlite3 /config/app.db 'select config_calibre_uuid from settings' 2>/dev/null || true)
if [ "$NEWID" != "$OLDID" ]; then
  sqlite3 /config/app.db "delete from archived_book; delete from book_read_link; delete from book_shelf_link; delete from bookmark; delete from downloads; delete from kobo_bookmark; delete from kobo_reading_state; delete from kobo_statistics; delete from kobo_synced_books; delete from thumbnail;"
fi
sqlite3 "$TMP/metadata.db" 'select count(*) from books'`

export const setLibraryLocation = sdk.Action.withInput(
  'set-library-location',

  async ({ effects }) => {
    const installed = await isNextExplorerInstalled(effects)
    const linked = !!(await storeJson.read((s) => s.libraryPath).const(effects))
    return {
      name: i18n('Set Library Location'),
      description: i18n(
        "Chooses where the Calibre library is stored: on Calibre-Web's own storage, or in a NextExplorer folder, which Nextcloud can show through External Storage. This action can only run while Calibre-Web is stopped; the change takes effect the next time it starts.",
      ),
      warning: null,
      allowedStatuses: 'only-stopped',
      group: null,
      visibility: installed || linked ? 'enabled' : 'hidden',
    }
  },

  InputSpec.of({
    location: Value.union({
      name: i18n('Library stored in'),
      description: i18n(
        'An existing Calibre library in the NextExplorer folder is used as it is. An empty folder receives a copy of the current library. Stop using desktop Calibre on a shared library whenever Calibre-Web is running: two programs writing the same metadata.db can lose changes.',
      ),
      default: 'local',
      variants: Variants.of({
        local: {
          name: i18n('Calibre-Web storage'),
          spec: InputSpec.of({}),
        },
        nextexplorer: {
          name: i18n('NextExplorer folder'),
          spec: InputSpec.of({
            folder: Value.text({
              name: i18n('Folder'),
              description: i18n(
                'The folder inside NextExplorer, starting from one of its locations, for example Files/Calibre Library. It is created if it does not exist.',
              ),
              required: true,
              default: 'Files/Calibre Library',
              patterns: [
                {
                  regex: '[^/.][^/]*(/[^/.][^/]*)*',
                  description: i18n(
                    'Enter a folder inside a NextExplorer location, for example Files/Calibre Library.',
                  ),
                },
              ],
            }),
          }),
        },
      }),
    }),
  }),

  async ({ effects }) => {
    const libraryPath = await storeJson.read((s) => s.libraryPath).once()
    return {
      location: libraryPath
        ? { selection: 'nextexplorer' as const, value: { folder: libraryPath } }
        : { selection: 'local' as const, value: {} },
    }
  },

  async ({ effects, input }) => {
    const folder =
      input.location.selection === 'nextexplorer'
        ? input.location.value.folder.trim().replace(/\/+$/, '')
        : null
    if (folder !== null) {
      if (!validLibraryFolder(folder)) {
        throw new Error(
          i18n(
            'Enter a folder inside a NextExplorer location, for example Files/Calibre Library.',
          ),
        )
      }
      if (!(await isNextExplorerInstalled(effects))) {
        throw new Error(i18n('NextExplorer is not installed.'))
      }
    }

    const current = await storeJson.read((s) => s.libraryPath).once()
    const res = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'calibre-web' },
      folder === null && current === null
        ? dataMounts(null)
        : nextexplorerMounts(true),
      'set-library-location',
      (sub) =>
        sub.exec(['sh', '-c', switchScript], {
          user: 'root',
          timeout: null,
          env: {
            FOLDER: folder ?? '',
            CURRENT: current ? `/import/${current}` : '/books',
          },
        }),
    )

    if (res.exitCode !== 0) {
      const detail = String(res.stderr).trim().split('\n')
      throw new Error(
        {
          10: i18n('The chosen folder does not contain a metadata.db file.'),
          12: i18n(
            'The chosen folder is not a healthy Calibre library: its metadata.db failed the database check.',
          ),
          13: i18n(
            'The library is incomplete: ${count} book files listed in metadata.db are missing, for example ${files}. If the upload is still running, wait for it to finish and try again.',
            { count: detail[0], files: detail.slice(1).join(', ') },
          ),
          14: i18n(
            'That folder already holds other files and is not a Calibre library.',
          ),
          16: i18n(
            'The first part of the folder must be an existing NextExplorer location, such as Files.',
          ),
        }[res.exitCode ?? 0] ??
          i18n('The change failed: ${detail}', { detail: detail.join(' ') }),
      )
    }

    await storeJson.merge(effects, { libraryPath: folder })

    return {
      version: '1',
      title: i18n('Library Location Updated'),
      message: i18n(
        'Calibre-Web will use this library the next time it starts.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Location'),
            description: null,
            value: folder
              ? i18n('NextExplorer: ${folder}', { folder })
              : i18n('Calibre-Web storage'),
            masked: false,
            copyable: false,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Books'),
            description: null,
            value: String(res.stdout).trim(),
            masked: false,
            copyable: false,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
