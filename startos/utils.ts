import { T, utils } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const uiPort = 8083
export const adminUsername = 'admin'

// The uid/gid the image's `abc` user is remapped to via PUID/PGID.
export const appUid = 1000

// The part of NextExplorer's manifest that `mountDependency` reads.
type NextExplorerManifest = T.SDKManifest & {
  id: 'nextexplorer'
  volumes: ['data']
}

export const nextexplorerVersionRange = '>=3.1.0:0 && <4.0.0:0'

// `libraryPath` is a folder in NextExplorer's `data` volume holding the
// library; null keeps it on this package's own `books` volume.
export const dataMounts = (libraryPath: string | null) => {
  const mounts = sdk.Mounts.of().mountVolume({
    volumeId: 'config',
    subpath: null,
    mountpoint: '/config',
    readonly: false,
  })
  return libraryPath
    ? mounts.mountDependency<NextExplorerManifest>({
        dependencyId: 'nextexplorer',
        volumeId: 'data',
        subpath: libraryPath,
        mountpoint: '/books',
        readonly: false,
      })
    : mounts.mountVolume({
        volumeId: 'books',
        subpath: null,
        mountpoint: '/books',
        readonly: false,
      })
}

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

// Mounts NextExplorer's whole `data` volume at /import, alongside the local
// library, for the actions that read or write NextExplorer folders. Nextcloud
// reaches the same files through its External Storage action.
export const nextexplorerMounts = (writable: boolean) =>
  dataMounts(null).mountDependency<NextExplorerManifest>({
    dependencyId: 'nextexplorer',
    volumeId: 'data',
    subpath: null,
    mountpoint: '/import',
    readonly: !writable,
  })

export const isNextExplorerInstalled = async (effects: T.Effects) =>
  (await sdk.getInstalledPackages(effects)).includes('nextexplorer')

// A folder inside one of NextExplorer's locations (its top-level folders).
export const validLibraryFolder = (folder: string) =>
  /^[^/.][^/]*(\/[^/.][^/]*)*$/.test(folder) &&
  !folder.split('/').includes('_users')

export const formatBytes = (bytes: number) => {
  const units = ['B', 'kB', 'MB', 'GB', 'TB']
  let i = 0
  while (bytes >= 1000 && i < units.length - 1) {
    bytes /= 1000
    i++
  }
  return `${i ? bytes.toFixed(1) : bytes} ${units[i]}`
}
