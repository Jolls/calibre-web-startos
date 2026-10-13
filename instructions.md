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
