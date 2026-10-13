import { T } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  appUid,
  formatBytes,
  isNextExplorerInstalled,
  nextexplorerMounts,
  validLibraryFolder,
} from '../utils'

const { InputSpec, Value } = sdk

// Lists `<folder>\t<book count>` for every Calibre library in NextExplorer.
// `_users` holds its private per-account folders.
const scan = `cd /import
find . -mindepth 2 -maxdepth 5 -name metadata.db -not -path './_users/*' | while IFS= read -r db; do
  n=$(sqlite3 -readonly "$db" 'select count(*) from books' 2>/dev/null || echo '?')
  printf '%s\\t%s\\n' "$(dirname "$db" | sed 's|^\\./||')" "$n"
done`

// Everything before the swap works on a copy in /books/.import-staging, so a
// failed check leaves the current library and the source untouched. Exit codes:
// 10 no metadata.db, 11 current library not empty, 12 failed database check,
// 13 book files missing.
const importScript = `set -eu
SRC="/import/$LIBRARY_DIR"
STAGE=/books/.import-staging
trap 'rm -rf "$STAGE"' EXIT
[ -f "$SRC/metadata.db" ] || exit 10
CUR=$(sqlite3 -readonly /books/metadata.db 'select count(*) from books' 2>/dev/null || echo 0)
if [ "$CUR" != 0 ] && [ "$REPLACE" != true ]; then exit 11; fi
rm -rf "$STAGE"
mkdir "$STAGE"
cp -a --reflink=auto "$SRC/." "$STAGE/"
cd "$STAGE"
[ "$(sqlite3 metadata.db 'pragma integrity_check')" = ok ] || exit 12
[ "$(sqlite3 metadata.db "select count(*) from sqlite_master where type = 'table' and name in ('books', 'authors', 'data', 'library_id')")" = 4 ] || exit 12
sqlite3 metadata.db 'pragma journal_mode = delete' > /dev/null
missing=$(sqlite3 metadata.db "select books.path || '/' || data.name || '.' || lower(data.format) from data join books on books.id = data.book" | while IFS= read -r f; do [ -f "$f" ] || printf '%s\\n' "$f"; done)
if [ -n "$missing" ]; then
  echo "$missing" | wc -l >&2
  echo "$missing" | head -n 3 >&2
  exit 13
fi
cd /
find /books -mindepth 1 -maxdepth 1 ! -name .import-staging -exec rm -rf {} +
find "$STAGE" -mindepth 1 -maxdepth 1 -exec mv -t /books {} +
chown -R ${appUid}:${appUid} /books
sqlite3 /config/app.db "delete from archived_book; delete from book_read_link; delete from book_shelf_link; delete from bookmark; delete from downloads; delete from kobo_bookmark; delete from kobo_reading_state; delete from kobo_statistics; delete from kobo_synced_books; delete from thumbnail;"
echo "$(sqlite3 /books/metadata.db 'select count(*) from books') $(du -sb /books | cut -f1)"`

type Found = { dir: string; count: string }

const findLibraries = async (effects: T.Effects) => {
  if (!(await isNextExplorerInstalled(effects))) return []
  const res = await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'calibre-web' },
    nextexplorerMounts(false),
    'find-libraries',
    (sub) => sub.execFail(['sh', '-c', scan], { user: 'root', timeout: null }),
  )
  return String(res.stdout)
    .split('\n')
    .filter(Boolean)
    .map((line): Found => {
      const [dir, count] = line.split('\t')
      return { dir, count }
    })
}

export const importLibrary = sdk.Action.withInput(
  'import-library',

  async ({ effects }) => {
    const installed = !!(await sdk
      .getStatus(effects, { packageId: 'nextexplorer' })
      .const())
    const linked = !!(await storeJson.read((s) => s.libraryPath).const(effects))
    return {
      name: i18n('Import Library'),
      description: i18n(
        'Replaces the Calibre-Web library with a Calibre library stored in NextExplorer. The copy is checked before anything is replaced, and the original is left untouched.',
      ),
      warning: null,
      allowedStatuses: 'only-stopped',
      group: null,
      visibility: installed && !linked ? 'enabled' : 'hidden',
    }
  },

  InputSpec.of({
    library: Value.dynamicSelect(async ({ effects }) => {
      const found = await findLibraries(effects)
      return {
        name: i18n('Library'),
        description: i18n(
          'A folder in NextExplorer that holds a Calibre library: a metadata.db file next to the author folders.',
        ),
        default: found[0]?.dir ?? '',
        values: found.length
          ? Object.fromEntries(
              found.map((f) => [
                f.dir,
                i18n('${path} (${count} books)', {
                  path: f.dir,
                  count: f.count,
                }),
              ]),
            )
          : { '': i18n('No Calibre library found') },
      }
    }),
    replace: Value.toggle({
      name: i18n('Replace the current library'),
      description: i18n(
        'Required when Calibre-Web already holds books. The current library, including its book files, is deleted once the new one has been copied and checked. Shelves, read status, and download history are cleared because they refer to the old books.',
      ),
      default: false,
    }),
  }),

  async () => null,

  async ({ effects, input }) => {
    if (await storeJson.read((s) => s.libraryPath).once()) {
      throw new Error(
        i18n(
          'Calibre-Web is storing its library in NextExplorer, so there is nothing to import. Set the library location back to Calibre-Web storage first.',
        ),
      )
    }
    if (!validLibraryFolder(input.library)) {
      throw new Error(
        i18n(
          'No Calibre library was found in NextExplorer. Upload your Calibre library folder to NextExplorer first.',
        ),
      )
    }

    const res = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'calibre-web' },
      nextexplorerMounts(false),
      'import-library',
      (sub) =>
        sub.exec(['sh', '-c', importScript], {
          user: 'root',
          timeout: null,
          env: {
            LIBRARY_DIR: input.library,
            REPLACE: String(input.replace),
          },
        }),
    )

    if (res.exitCode !== 0) {
      const detail = String(res.stderr).trim().split('\n')
      throw new Error(
        {
          10: i18n('The chosen folder does not contain a metadata.db file.'),
          11: i18n(
            'Calibre-Web already holds books. Turn on "Replace the current library" to replace them.',
          ),
          12: i18n(
            'The chosen folder is not a healthy Calibre library: its metadata.db failed the database check.',
          ),
          13: i18n(
            'The library is incomplete: ${count} book files listed in metadata.db are missing, for example ${files}. If the upload is still running, wait for it to finish and try again.',
            { count: detail[0], files: detail.slice(1).join(', ') },
          ),
        }[res.exitCode ?? 0] ??
          i18n('The import failed: ${detail}', { detail: detail.join(' ') }),
      )
    }

    const [books, bytes] = String(res.stdout).trim().split(/\s+/)
    return {
      version: '1',
      title: i18n('Library Imported'),
      message: i18n('Start Calibre-Web to browse the imported library.'),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Books'),
            description: null,
            value: books,
            masked: false,
            copyable: false,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Library size'),
            description: null,
            value: formatBytes(Number(bytes)),
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
