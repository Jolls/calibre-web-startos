# Calibre-Web

## Documentation

- [Calibre-Web wiki](https://github.com/janeczku/calibre-web/wiki) — configuration, user management, and troubleshooting

## What you get on StartOS

A **Web UI** interface serving your ebook library. The library starts empty: it lives on the service's own storage and is managed entirely from the browser, so you don't need the Calibre desktop app. Calibre-Web also publishes an OPDS feed at `/opds` on the same address for ebook reader apps.

Uploads are switched on, so you can add books straight from the web interface.

## Getting set up

1. Open the Calibre-Web service. A task asks you to set the admin password; run **Set Admin Password** and copy the username and password it shows. They aren't shown again, but you can run the action again for a new one.
2. Start the service.
3. Open the **Web UI** and sign in as `admin` with that password.
4. Click **Upload** to add your first books.
5. To give other people access, add users from Calibre-Web's admin settings.

## Admin account

The `admin` password is managed by StartOS: each start applies the password from **Set Admin Password**, so a password changed inside Calibre-Web is replaced at the next start. Keep the account named `admin`, and create separate users for everyone else.

## Importing an existing Calibre library

To bring a library you already have onto Calibre-Web:

1. Close Calibre on your computer, then upload the whole library folder (the one with `metadata.db` in it) to NextExplorer. With Nextcloud, upload into its **NextExplorer** folder, which Nextcloud's **External Storage** action provides. Wait for the upload to finish.
2. Run **Import Library** and pick your library from the list.
3. If Calibre-Web already holds books, switch on **Replace the current library**. Its books are deleted once the new library has been copied and checked.
4. Start Calibre-Web and sign in.

The import checks the copy before replacing anything, and your uploaded folder is left as it was; delete it once you're happy. Only the library comes across, not another Calibre-Web's users or settings.

## Keeping the library in NextExplorer

By default the library lives on Calibre-Web's own storage. To keep it in a NextExplorer folder instead, where Nextcloud can show it and desktop Calibre can open it:

1. Run **Set Library Location**, choose **NextExplorer folder**, and enter a folder that starts with one of your NextExplorer locations, for example `Files/Calibre Library`.
2. An empty or new folder receives a copy of your current library. A folder that already holds a Calibre library is used as it is.
3. Start Calibre-Web.

Only one program should write the library at a time. Stop Calibre-Web before you work on the library in desktop Calibre, wait for it to finish syncing, and start Calibre-Web again afterwards.

The library in NextExplorer is backed up with NextExplorer, not with Calibre-Web. Run **Set Library Location** again and choose **Calibre-Web storage** to go back. That uses the older copy still on Calibre-Web's storage, without any changes you made while the library was in NextExplorer.
