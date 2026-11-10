# Casho legal pages (Terms of Use + Privacy Policy)

Plain static files: `index.html`, `terms.html`, `privacy.html`, `style.css`. No build step, no scripts, no external files.
Every page links to the others with relative links, so the folder works from any address.

## Before these go public (the owner must do this)

- **Have a lawyer review both documents**, English and Arabic. They are a careful first draft written from how the app works, not legal advice.
  Things the lawyer should confirm: the legal operator name ("Mrsam"), governing law and courts, data-protection wording (Saudi PDPL, data processed
  outside the Kingdom), retention periods, the liability limit, and the Arabic translation.
- **Create the support mailbox** `support@appcasho.com` (or change it, see below). Users and Apple will write to it.

## Step 1: host on GitHub Pages (free)

1. Create a new **public** GitHub repository, for example `cashO-legal`.
2. Upload the four files of this folder to the repository root (`index.html`, `terms.html`, `privacy.html`, `style.css`).
3. Repository → Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`. Save.
4. After about a minute the pages are at `https://<github-user>.github.io/cashO-legal/`.
5. In the app, open `OCash/Config.swift` and set
   `static let legalBaseURL = "https://<github-user>.github.io/cashO-legal/"` (keep the trailing `/`).
   The Terms and Privacy links then appear on the sign-in screen and in Profile.
6. In App Store Connect, put `.../privacy.html` in the **Privacy Policy URL** field (required by Apple).

## Step 2: move to your own domain (for the developer)

1. Copy the four files to the new place on the domain, for example `https://mrsam.io/cashO/` (any folder works, nothing else is needed).
2. Check that `https://mrsam.io/cashO/terms.html` and `privacy.html` open.
3. Change **one line** in `OCash/Config.swift`: `legalBaseURL = "https://mrsam.io/cashO/"`, then ship a new app build.
4. Update the Privacy Policy URL in App Store Connect.
5. Keep the old GitHub address alive (or set a redirect) for a few weeks, so people on older app versions still reach the pages.

## Changing the text or the contact email

The support email appears in all three pages. Find and replace it everywhere, and also change `supportEmail` in `OCash/Config.swift`:

```bash
grep -rn "support@appcasho.com" legal OCash/Config.swift
```

If you change what the app collects or how orders, refunds or payouts work, update the matching section here and change the effective date.
