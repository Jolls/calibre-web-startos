import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { adminUsername, appUid, dataMounts, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Calibre-Web!'))

  const adminPassword = await storeJson
    .read((s) => s.adminPassword)
    .const(effects)
  if (!adminPassword) {
    throw new Error('The admin password has not been set')
  }

  // Applies the stored password through Calibre-Web's own CLI, which also
  // enforces its password policy. A rename of the admin user in the web UI
  // leaves the stored password unapplied.
  const applyPassword = `cd /app/calibre-web && python3 cps.py -p /config/app.db -s "${adminUsername}:$ADMIN_PASSWORD" || echo "Could not set the password for '${adminUsername}'"`

  return sdk.Daemons.of(effects)
    .addOneshot('set-admin-password', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'calibre-web' },
        dataMounts(),
        'set-admin-password-sub',
      ),
      exec: {
        command: ['sh', '-c', applyPassword],
        env: { CALIBRE_DBPATH: '/config', ADMIN_PASSWORD: adminPassword },
        user: 'root',
      },
      requires: [],
    })
    .addDaemon('calibre-web', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'calibre-web' },
        dataMounts(),
        'calibre-web-sub',
      ),
      exec: {
        command: sdk.useEntrypoint(),
        // The image bundles s6-overlay, which must be PID 1.
        runAsInit: true,
        env: { PUID: String(appUid), PGID: String(appUid) },
      },
      ready: {
        display: i18n('Web Interface'),
        gracePeriod: 60_000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
      },
      requires: ['set-admin-password'],
    })
})
