import { storeJson } from './fileModels/store.json'
import { nextexplorerDescription } from './manifest/i18n'
import { sdk } from './sdk'
import { nextexplorerVersionRange } from './utils'

// Required only while the library is stored in a NextExplorer folder. `exists`,
// not `running`: Calibre-Web needs the volume on disk to mount, not the service.
export const dependencies = sdk.Dependencies.of().addDependency(
  sdk.Dependency.optional('nextexplorer', {
    description: nextexplorerDescription,
    metadata: {
      title: 'NextExplorer',
      icon: 'https://raw.githubusercontent.com/Start9Labs/nextexplorer-startos/04f7ecbfc31ad2205e0222dd7568fb881aa06c79/icon.svg',
    },
    versionRange: nextexplorerVersionRange,
    kind: 'exists',
    enabled: async ({ effects }) =>
      !!(await storeJson.read((s) => s.libraryPath).const(effects)),
  }),
)
