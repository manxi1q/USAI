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

## Publishing a story

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
