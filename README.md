# USAI | The American Ideal — usamericanideal.com

Static site. No build step, no dependencies. All real links are already in
place (Discord, Roblox community, wiki, domain) — nothing to replace.

## ⚠️ Fixing the "only the homepage works" problem

Your Worker serves `/` but 404s on everything else because it has no static
assets configuration. `wrangler.toml` in this folder is the fix:

```toml
name = "usaideploy"
compatibility_date = "2026-08-01"

[assets]
directory = "./"
html_handling = "auto-trailing-slash"
not_found_handling = "404-page"
```

Commit it at the **root of the repository** and redeploy. `html_handling`
is what makes `/press` resolve to `press.html` and `/wire/` resolve to
`wire/index.html`. `not_found_handling` serves the styled `404.html`.

If subpages still fail after that, the Worker deployment type is the problem,
not the config — a Pages project is simpler for a site with no server-side
code. Create one pointed at the same repo, build command empty, output
directory `/`, then move the custom domain over to it.

## Files

```
index.html        Home
about.html        The Ideal — founding and story
government.html   Institutions, procedure, offices
press.html        Press corps — Eagle Wire live, four newsrooms in build
roblox.html       Community, house rules, venues
join.html         Onboarding, roles, community standards (#conduct)
404.html          Styled not-found page
styles.css        Façade styling (design tokens at the top)
app.js            Mobile menu, scroll reveal, footer year
assets/           usai-logo.png, usai-eagle.png, usai-banner.png, usai-hero.png

wire/
  index.html      Eagle Wire front page
  section.html    section.html?name=Capitol
  article.html    article.html?id=slug
  articles.json   ← ALL CONTENT LIVES HERE
  wire.css  wire.js

wrangler.toml  _headers  _redirects  robots.txt  sitemap.xml
```

## Design direction

Modelled on whitehouse.gov: cream paper (`#F9F7F2`) as the dominant surface,
navy (`#141B33`) reserved for the masthead, footer and a few feature panels,
gold (`#C6A03A`) for hairlines, eyebrows and accents. The bright flag blue from
the logo now appears only in the logo itself, which is what stops the site
reading as "too blue".

Type: **Bodoni Moda** for headlines (the high-contrast didone that gives the WH
site its voice), **Inter** for navigation, labels and decks, **Source Serif 4**
for article body copy. Change the tokens in `:root` and both stylesheets follow.

## Supabase — database and newsroom panel

### 1. Create the database

Create a project at supabase.com, open the **SQL Editor**, and run
`wire/supabase-schema.sql` from top to bottom. It creates:

- `articles` — every story, with a JSONB `body` of blocks
- `staff` — who may reach the admin panel, and with what role
- Row Level Security so anonymous visitors read **published stories only**
- a `wire-images` storage bucket for uploaded photos
- triggers that stamp `published_at` and keep exactly one lead story

### 2. Connect the site

Project Settings → API. Copy the Project URL and the **anon public** key into
`wire/config.js`:

```js
window.WIRE_CONFIG = {
  SUPABASE_URL: "https://xxxxxxxxxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGci…",
  OUTLET: "eagle-wire"
};
```

That is the only line to change. The anon key is meant to be public — RLS is
what protects the data, and the policies only expose published stories to
anonymous readers.

Leave `SUPABASE_URL` empty and the site keeps reading `articles.json`. If
Supabase is ever unreachable, the site falls back to that file automatically
rather than going blank.

### 3. Give yourself access

Authentication → Users → Add user. Then copy the UUID and run:

```sql
insert into public.staff (user_id, outlet, role, byline, desk)
values ('PASTE-UUID-HERE', 'eagle-wire', 'admin', 'M. Breton', 'Capitol desk');
```

A valid login is **not** enough — without a row in `staff`, the panel signs the
account straight back out. That is the whole access control, and it is enforced
in the database, not in the browser.

### 4. Use the newsroom

`usamericanideal.com/wire/admin.html` — linked from the bottom of the press
page, excluded from `robots.txt` and served `no-store`.

- Sign in, see every story with its status and which one is the lead
- Block editor: paragraph, subheading, pull quote, list, reorderable
- Slug fills itself from the headline, and warns on collisions
- Upload photos straight to the bucket, or paste a URL
- Save as draft or publish; drafts never reach the public site
- **Import starter stories** pushes the seven articles from `articles.json`
  into the database in one click, so you are not starting empty

To add a reporter later, create their user in Supabase and insert a `staff` row
with role `reporter`. The same panel serves everyone.

### Adding the other four newsrooms

The schema is already multi-outlet — every row carries an `outlet` column.
Beacon, Patriot One, the Standard and the Ledger each get a copy of the `wire/`
folder with a different `OUTLET` in their `config.js`, pointed at the same
database. No schema changes needed.

## Publishing a story (without Supabase)

Add an object at the **top** of the `articles` array in `wire/articles.json`.
Only one article should carry `"lead": true`.

```json
{
  "id": "unique-slug-used-in-the-url",
  "section": "Capitol",
  "kicker": "Capitol",
  "headline": "The headline",
  "dek": "One or two sentences under the headline.",
  "author": "R. Halloway",
  "desk": "Capitol desk",
  "date": "2026-08-27",
  "image": "img/optional.jpg",
  "caption": "Optional photo caption.",
  "body": [
    { "t": "p", "v": "A paragraph." },
    { "t": "h2", "v": "A subheading" },
    { "t": "quote", "v": "A pull quote." },
    { "t": "list", "v": ["First item", "Second item"] }
  ]
}
```

`section` must match a nav section (Capitol, Executive, Courts, Elections,
Explainers). Without an `image`, a neutral placeholder is drawn — the layout
never breaks. The breaking bar and docket box come from the `breaking` and
`docket` arrays at the top of the same file.

## Moving to a real backend later

`wire.js` reads `articles.json` in a single `fetch` at the top of the file.
Point `DATA_URL` at a Supabase endpoint or a Worker returning the same JSON
shape and every render function keeps working — same approach as the Weazel
News admin panel.

## Compliance notes

- All outlet names are original. No real broadcaster, newspaper or wire service
  branding appears anywhere on the site.
- Fictional-simulation disclaimer in the top strip and footer of every page,
  plus an end-note on every Eagle Wire article.
- `join.html#conduct` bans real-world political advocacy, fundraising, mature
  content and sharing personal information.
