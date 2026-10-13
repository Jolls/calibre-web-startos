export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Calibre-Web!': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,

  // interfaces.ts
  'Web UI': 4,
  'The web interface of Calibre-Web': 5,

  // actions/setAdminPassword.ts
  'Set Admin Password': 6,
  'Generates a new random password for the Calibre-Web admin account. This action can only run while Calibre-Web is stopped; the new password takes effect the next time it starts.': 7,
  'This replaces the current admin password, and the old one stops working.': 8,
  'Calibre-Web Admin Password': 9,
  'Sign in to Calibre-Web with this username and password.': 10,
  Username: 11,
  Password: 12,

  // init/watchCredentials.ts
  'Set the admin password before signing in to Calibre-Web': 13,

  // actions/importLibrary.ts and actions/setLibraryLocation.ts
  'Import Library': 14,
  'Replaces the Calibre-Web library with a Calibre library stored in NextExplorer. The copy is checked before anything is replaced, and the original is left untouched.': 15,
  Library: 16,
  'A folder in NextExplorer that holds a Calibre library: a metadata.db file next to the author folders.': 17,
  'No Calibre library found': 18,
  'Replace the current library': 19,
  'Required when Calibre-Web already holds books. The current library, including its book files, is deleted once the new one has been copied and checked. Shelves, read status, and download history are cleared because they refer to the old books.': 20,
  '${path} (${count} books)': 21,
  'No Calibre library was found in NextExplorer. Upload your Calibre library folder to NextExplorer first.': 22,
  'The chosen folder does not contain a metadata.db file.': 23,
  'Calibre-Web already holds books. Turn on "Replace the current library" to replace them.': 24,
  'The chosen folder is not a healthy Calibre library: its metadata.db failed the database check.': 25,
  'The library is incomplete: ${count} book files listed in metadata.db are missing, for example ${files}. If the upload is still running, wait for it to finish and try again.': 26,
  'The import failed: ${detail}': 27,
  'Library Imported': 28,
  'Start Calibre-Web to browse the imported library.': 29,
  Books: 30,
  'Library size': 31,
  'Calibre-Web is storing its library in NextExplorer, so there is nothing to import. Set the library location back to Calibre-Web storage first.': 32,
  'Set Library Location': 33,
  "Chooses where the Calibre library is stored: on Calibre-Web's own storage, or in a NextExplorer folder, which Nextcloud can show through External Storage. This action can only run while Calibre-Web is stopped; the change takes effect the next time it starts.": 34,
  'Library stored in': 35,
  'An existing Calibre library in the NextExplorer folder is used as it is. An empty folder receives a copy of the current library. Stop using desktop Calibre on a shared library whenever Calibre-Web is running: two programs writing the same metadata.db can lose changes.': 36,
  'Calibre-Web storage': 37,
  'NextExplorer folder': 38,
  Folder: 39,
  'The folder inside NextExplorer, starting from one of its locations, for example Files/Calibre Library. It is created if it does not exist.': 40,
  'Enter a folder inside a NextExplorer location, for example Files/Calibre Library.': 41,
  'NextExplorer is not installed.': 42,
  'That folder already holds other files and is not a Calibre library.': 43,
  'The first part of the folder must be an existing NextExplorer location, such as Files.': 44,
  'The change failed: ${detail}': 45,
  'Library Location Updated': 46,
  'Calibre-Web will use this library the next time it starts.': 47,
  Location: 48,
  'NextExplorer: ${folder}': 49,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
