import { utils } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const uiPort = 8083
export const adminUsername = 'admin'

// The uid/gid the image's `abc` user is remapped to via PUID/PGID.
export const appUid = 1000

export const dataMounts = () =>
  sdk.Mounts.of()
    .mountVolume({
      volumeId: 'config',
      subpath: null,
      mountpoint: '/config',
      readonly: false,
    })
    .mountVolume({
      volumeId: 'books',
      subpath: null,
      mountpoint: '/books',
      readonly: false,
    })

const passwordClasses = [/[a-z]/, /[A-Z]/, /[0-9]/, /[!@#%*?]/]

// Calibre-Web rejects a password without a lowercase letter, an uppercase
// letter, a digit, and a symbol.
export const generateAdminPassword = () => {
  for (;;) {
    const password = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9,!,@,#,%,*,?',
      len: 32,
    })
    if (passwordClasses.every((re) => re.test(password))) return password
  }
}
