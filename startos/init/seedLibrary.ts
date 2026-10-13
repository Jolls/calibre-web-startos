import { sdk } from '../sdk'
import { appUid, dataMounts } from '../utils'

// An empty Calibre library (upstream's library/metadata.db), the settings
// database with the library path and uploads preset, and ownership for the
// uid the image runs as.
const seed = `set -eu
cp /assets/metadata.db /books/metadata.db
chown -R ${appUid}:${appUid} /books
cd /app/calibre-web
CALIBRE_DBPATH=/config python3 cps.py -d > /dev/null 2>&1
sqlite3 /config/app.db "update settings set config_calibre_dir='/books', config_uploading=1, config_kepubifypath='/usr/bin/kepubify';"
chown ${appUid}:${appUid} /config/app.db`

export const seedLibrary = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'calibre-web' },
    dataMounts(null).mountAssets({
      subpath: null,
      mountpoint: '/assets',
      type: 'directory',
    }),
    'seed-library',
    (sub) => sub.execFail(['sh', '-c', seed]),
  )
})
