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
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
