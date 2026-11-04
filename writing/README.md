# Writing: how to add a post

Every post on `writing.html` comes from one file: `writing/posts.js`. There's no build step. Edit the file, save, refresh.

## Add a post

Open `writing/posts.js` and add an object to the top of the `window.POSTS` array. Order doesn't matter; the page sorts by date, newest first.

```js
{
  slug: "why-i-ship-on-main",          // unique, lowercase, dashes. Becomes writing.html?post=why-i-ship-on-main
  title: "Why I ship on main",
  date: "2026-11-10",                  // YYYY-MM-DD
  source: "essay",                     // "x" | "linkedin" | "essay"
  summary: "One or two lines shown in the list.",
  body: `First paragraph.

Second paragraph with **bold** and a [link](https://example.com).`,
  url: ""                              // optional: link to the original X / LinkedIn post
},
```

### Fields

| Field | Required | What it does |
|---|---|---|
| `slug` | yes | Unique id used in the URL. |
| `title` | yes | Headline. |
| `date` | yes | `YYYY-MM-DD`. |
| `source` | yes | `x`, `linkedin`, or `essay`. Sets the badge, icon, and filter. |
| `summary` | no | Shown under the title in the list. |
| `body` | one of `body` / `url` | The post text. Gets its own page on this site. |
| `url` | one of `body` / `url` | Link to the original post. With no `body`, the list links straight out. With both, the post page shows an "Original on X/LinkedIn" link. |
| `draft` | no | `true` adds a yellow **Draft** badge and banner. Delete it when the post is real. |

### Three common cases

- **An X or LinkedIn post you just want to link to:** set `url`, skip `body`.
- **An X or LinkedIn post you want archived here too:** paste the text into `body` and set `url`.
- **A long essay:** write it in `body`, skip `url`.

### Body formatting

Plain text with a few markdown basics. Use a template string (backticks) so line breaks are kept.

- A blank line starts a new paragraph
- `## Heading` makes a section heading
- `> quote` makes a pull quote
- Lines starting with `- ` become a list
- `**bold**` and `[text](https://link)`

Everything else is shown as plain text (HTML is escaped), so a stray `<` can't break the page.

## Before you publish

1. Delete the three seeded drafts (each has `draft: true` and "[DRAFT" in its summary), or replace their bodies with the real thing and remove `draft: true`.
2. Preview locally: `python3 -m http.server 4321` from the repo root, then open http://localhost:4321/writing.html.
3. Posts also show up in the ⌘K command menu on every page.
