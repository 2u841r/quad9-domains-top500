# Building a Browser for Quad9's Public DNS Data

Quad9 is a non-profit DNS resolver. They publish a daily list of the 500 most queried domains through their infrastructure, going back to mid-2025. The data is on GitHub, one NDJSON file per day, completely public.

I had known about Quad9 for a few years. At some point I went looking for a way to actually browse and explore that data, something you could open in a browser and look around in. There was nothing. Just raw files in a repository. So I built one.

This post is about the decisions I made along the way.

## The Data

Each daily file has 500 lines. Every line is a JSON object:

```json
{"rank": 1, "domain_name": "example.com"}
{"rank": 2, "domain_name": "other.com"}
```

Simple. But once you want to show trends across weeks or months, you need many of these files at once. And the format is heavier than it looks.

## The Format Problem

The first version fetched NDJSON files directly from the GitHub repository on demand. For a single day that was fine. For a quarterly view it meant 90 separate network requests, each one parsing JSON text in the browser. On a slow mobile connection the wait was long enough to feel broken.

So I ran an experiment. Took one day's file, 500 domains, and converted it to three formats to compare size and token count:

| Format | Size | Tokens |
|--------|------|--------|
| NDJSON | 36,460 bytes | 13,886 |
| CSV | 13,986 bytes | 6,768 |
| [TOON](https://github.com/toon-format/toon) | 14,993 bytes | 7,771 |

CSV wins. The reason is specific to this dataset: every row has exactly the same two fields, and the rank is just the line number so you can drop it entirely. A CSV file for one day is just 500 domain names, one per line. TOON's header-deduplication advantage would matter more with nested or varied schemas. For flat uniform rows, CSV has less overhead.

But even CSV was not the answer. The domain names repeat constantly across files. Writing `googleapis.com` or `microsoft.com` in hundreds of separate files wastes space on repetition that carries no new information.

## Binary Encoding

The real fix came from separating what changes from what stays the same.

Build a dictionary once: read every domain that has ever appeared in any file and assign each one a sequential integer ID. Store it as a plain text file, one domain per line, where the line number is the ID. Across the full history there are roughly 10,000 unique domains.

Then encode each day as binary: 500 domain IDs in rank order, each stored as a 16-bit unsigned integer. That is 2 bytes per domain, 1000 bytes per day total.

| | Before | After |
|---|---|---|
| Per day | 36,460 bytes | 1,000 bytes |
| All 331 days | ~12 MB | 331 KB |
| Dictionary (one-time) | — | 141 KB |
| Total | ~12 MB | ~472 KB |

97 percent smaller. Decoding in the browser is a single typed array operation with no parsing:

```js
const ids = new Uint16Array(await response.arrayBuffer())
const domains = Array.from(ids, id => dict[id])
```

## One File for Everything

Even at 1 KB per day, 90 requests for a quarterly view is still 90 round trips. The solution was to concatenate all daily files into a single `all.bin`, loaded once and cached in memory. A companion `manifest.json` maps each date to its position in the file. Slicing out any date range is arithmetic:

```js
const start = dayIndex * 500
const slice = allBuf.subarray(start, start + 500)
```

The full history sits at around 470 KB. After the initial load, switching between monthly, quarterly, and yearly views requires no further network requests.

## The Site

The frontend is built with Vite and React, deployed as a static site on GitHub Pages with a custom domain. No backend, no database. Everything runs in the browser.

A GitHub Actions workflow pulls new data from the upstream Quad9 repository every day at 11:18 UTC, then rebuilds and redeploys. The site stays current without any manual steps.

Compare mode lets you compare multiple time periods at once. Each period gets its own rank and change column in the table, so you can track how domains shifted across days, months, or quarters in a single view. Add as many periods as you need, remove any you do not. Domains that appear in one period but not another are marked.

## Interface Decisions

Data like this is best on a desktop monitor. But people check things on phones too, and a dashboard that falls apart on mobile only half works. The rank and domain columns stay sticky so you never lose context while scrolling right. Long domain names truncate with an ellipsis: one tap expands, a second tap opens the site. Section headings and column headers stay fixed as you scroll down through long tables. Rows highlight on hover. Small things, but they add up.

## Rendering Performance

Yearly view with compare mode was slow. React profiler showed StickyTable taking 883ms out of a 1015ms render -- the table was creating 500 rows times 7 cells = 3,500 DOM nodes all at once, even though only around 25 are visible at any time.

The fix is virtual scrolling: render only what is visible, pad the tbody with empty rows at top and bottom to preserve scroll height, and swap rows in and out as you scroll. The DOM stays small regardless of list length.

I read [Writing down every UUID](https://eieio.games/blog/writing-down-every-uuid/) around the same time -- a post about a site that lets you scroll through all 2^122 possible UUIDs. The author solves the same shape of problem at a much more extreme scale: browsers cap scroll position at a 32-bit integer, so native scrolling breaks entirely, and the author ends up reimplementing scroll as a BigInt with custom mouse and keyboard handlers. My problem was simpler, but the framing helped -- if you cannot render everything, figure out exactly what you do need to render and fake the rest.

The table now uses [@tanstack/react-virtual](https://tanstack.com/virtual) with window-based scrolling. Rows over 150 get virtualized automatically. Render time dropped from 883ms to 13.7ms -- about 64x faster.

## Facts

One section runs a full analysis over the entire dataset client-side and surfaces things that are hard to see day to day.

Consistency: which domains appear most reliably? No domain has hit every single day. Even large platforms like `google.com` miss occasionally. The most consistent ones sit around 89 to 95 percent coverage.

TLD breakdown: `.com` dominates, but the distribution across country-code and newer TLDs is worth looking at.

Domain length: most labels cluster between 5 and 15 characters. The outliers at both ends are interesting.

Day-of-week patterns: some domains rank higher on weekends, others on weekdays. The signal is subtle but visible when you average across months of data.

All of this computes from the cached `all.bin` buffer. No extra fetches.

## Source

Data from [Quad9DNS/quad9-domains-top500](https://github.com/Quad9DNS/quad9-domains-top500). Site source at [2u841r/quad9-domains-top500](https://github.com/2u841r/quad9-domains-top500).
