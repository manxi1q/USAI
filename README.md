# USAI | The American Ideal — website

Static site. No build step, no dependencies. Push to GitHub, let Cloudflare
Pages deploy it.

```
index.html      Home — hero, Eagle Wire ticker, pillars, story, press, join
about.html      The Ideal — history, institutions, session cycle, wiki
press.html      Press corps — Eagle Wire live, four newsrooms in build
roblox.html     Group, house rules, experiences with Play buttons
join.html       Onboarding, roles, community standards (#conduct)
styles.css      Façade styling (design tokens at the top)
app.js          Mobile menu, scroll reveal, footer year
assets/         emblem.svg, wire-mark.svg

wire/
  index.html      Eagle Wire front page
  section.html    Section listing — section.html?name=Capitol
  article.html    Article page — article.html?id=slug
  articles.json   ← ALL CONTENT LIVES HERE
  wire.css        Newsroom styling
  wire.js         Renderer

_headers _redirects robots.txt sitemap.xml
```

## Replace before going live

| Placeholder | Replace with |
|---|---|
| `https://discord.gg/YOUR-INVITE` | your permanent Discord invite |
| `https://www.roblox.com/groups/0000000` | your Roblox group URL |
| `https://www.roblox.com/games/000000000` | each experience URL (3 in roblox.html) |
| `YOURDOMAIN.com` | your real domain |

## Deploy on Cloudflare Pages

1. Push this folder to a GitHub repository.
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git.
3. Build command: *(empty)* · Build output directory: `/`
4. Add your domain under **Custom domains**.

Eagle Wire will live at `yourdomain.com/wire/`. To move it to
`wire.yourdomain.com` later, point a second Pages project at the `wire/`
folder and update the links in the façade footer.

## Publishing a story

Open `wire/articles.json` and add an object at the **top** of the `articles`
array. Only one article should carry `"lead": true`.

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

`section` must match one of the nav sections (Capitol, Executive, Courts,
Elections, Explainers) for the story to appear on its section page. Without an
`image`, a neutral placeholder is drawn — layout never breaks.

The front page fills itself: lead story, three side stories, six grid stories,
five latest filings. The breaking bar and the docket box come from the
`breaking` and `docket` arrays at the top of the same file.

## Moving to a real backend later

`wire.js` reads `articles.json` in one `fetch` at the top of the file. Point
`DATA_URL` at a Supabase endpoint or a Cloudflare Worker returning the same
JSON shape and every render function keeps working unchanged — same approach
as the Weazel News admin panel.

## Design tokens

Both stylesheets share the same `:root` palette: white paper, federal blue
`#0F3D91` / navy `#0A2A66`, gold `#B08D2E` with `#D8AE3F` as the lift. Change
them there and the whole site follows.

## Compliance notes

- All outlet names and marks are original. No real broadcaster, newspaper or
  wire service branding appears anywhere.
- The emblem is an original design, not a reproduction of the Great Seal.
- A fictional-simulation disclaimer sits in the top strip and footer of every
  page, plus an end-note on every Eagle Wire article.
- `join.html#conduct` bans real-world political advocacy, fundraising, mature
  content and sharing personal information.
