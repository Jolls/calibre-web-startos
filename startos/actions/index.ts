import { sdk } from '../sdk'
import { importLibrary } from './importLibrary'
import { setAdminPassword } from './setAdminPassword'
import { setLibraryLocation } from './setLibraryLocation'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(setLibraryLocation)
  .addAction(importLibrary)
