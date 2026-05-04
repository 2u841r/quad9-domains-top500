# How This Dashboard Works

## What is Quad9?

Quad9 is a non-profit DNS resolver focused on privacy and security. When you type a domain into your browser, your computer sends a query to a DNS server to translate that name into an IP address. Quad9 handles billions of those queries every day, and unlike many large commercial resolvers, it operates without interest in profiling or selling your data.

As part of their transparency commitment, Quad9 publishes a daily list of the 500 most queried domains through their resolver. Each file covers one calendar day, lists domains in rank order from most to least queried, and is released publicly on GitHub. The dataset starts from June 2025 and grows by one file every day.

The question this dashboard tries to answer: what patterns emerge when you look at this data across weeks, months, and quarters?

## The Raw Data Format

Each daily file from Quad9 is NDJSON, where every line is a separate JSON object:

```json
{"rank": 1, "domain_name": "example.com"}
{"rank": 2, "domain_name": "other.com"}
```

Five hundred lines per day. Readable and easy to work with, but the format carries real overhead. Field names repeat on every line. Values are wrapped in quotes. Newlines and braces add up. A single day's file weighs around 36 kilobytes.

For a dashboard that needs to load a year of data, that is over 13 megabytes of text that needs to be fetched, parsed, and processed before anything appears on screen.

## Exploring Smaller Formats

### CSV

The obvious first step was CSV. Strip the field names, keep only the values, one per line. For this dataset, CSV actually helps meaningfully. The reason is that every row has exactly the same two fields: rank and domain name. And the rank is just the line number, so you can drop it entirely. A CSV file for one day becomes 500 domain names with no overhead at all.

File sizes drop noticeably, but the domain names themselves are still the bottleneck. Most of them repeat across many days. Writing `googleapis.com` or `microsoft.com` in 300 separate files wastes space on repetition that carries no new information.

### TOON

[TOON](https://github.com/toon-format/toon) (Transposed Object Notation) represents data in a columnar structure, rotating the table so that attributes become the primary axis rather than records. For dense numerical data this can be very efficient. For this dataset, one interesting shape is to make domains the rows and dates the columns, storing the rank in each cell.

That structure is great for questions like "how did this domain rank across time?" But for a dashboard where users mostly ask "what were the top 500 domains on this date?", you end up slicing across the grain of the data every time. The access pattern does not fit the format.

### Measured Results

To make this concrete, we ran all three formats against a real day's data (500 domains):

| Format | Size | Tokens |
|--------|------|--------|
| NDJSON | 36,460 bytes | 13,886 |
| CSV | 13,986 bytes | 6,768 |
| TOON | 14,993 bytes | 7,771 |

CSV wins on both size and token count. TOON comes in slightly larger than CSV here because the data is flat uniform records: every row has the same two fields. TOON's header-deduplication advantage only kicks in with nested or varied schemas. For a table of 500 identical-shaped rows, CSV has less overhead.

Neither gets close to what binary encoding achieves.

### Binary Encoding

The real breakthrough came from noticing that the domain names repeat constantly while only the ranks change. If each domain could be referred to by a number instead of its full name, the daily files could shrink to almost nothing.

The approach uses two parts.

**Dictionary.** Read every domain that has ever appeared across the full dataset. Assign each one a sequential integer ID starting from zero. Store this as a plain text file with one domain per line, so the line number is the ID. Across the entire history there are roughly 10,000 unique domains.

**Daily binary files.** Each day contains 500 domain IDs in rank order. Store each ID as a 16-bit unsigned integer in little-endian byte order. That is 2 bytes per domain, 500 domains per day, 1000 bytes total per file.

36 kilobytes per day becomes 1 kilobyte. A 97 percent reduction with no data loss.

Decoding in the browser requires no parsing at all:

```js
const ids = new Uint16Array(await response.arrayBuffer())
const domains = Array.from(ids, id => dict[id])
```

The browser reads raw bytes into a typed array and maps each ID to a name using the dictionary. No JSON.parse, no string splitting, no garbage collection pressure from thousands of intermediate strings.

## One File for Aggregate Views

Individual daily files work well for the daily view: fetch one file, decode it, display it. But monthly and quarterly views need data from many days. Fetching 90 files for a quarterly view means 90 separate network round trips, even if each one is only 1 kilobyte.

The solution is `all.bin`: all daily files concatenated in chronological order into a single download. A companion `manifest.json` maps each date to its position in the file. Slicing out a date range is pure arithmetic:

```js
const start = dayIndex * 500
const slice = allBuf.subarray(start, start + 500)
```

The full history as of this writing is around 470 kilobytes uncompressed. It is fetched once and cached in memory. Switching between monthly, quarterly, and yearly views after that requires no additional network requests.

## The Dashboard

The frontend is built with Vite and React, served as a static site on GitHub Pages with a custom domain. There is no backend. All data lives in the `public/data/` directory, generated at build time by a Node script that reads the raw NDJSON files from the repository and produces the dictionary, per-day binaries, and `all.bin`.

A GitHub Actions workflow syncs new data from the upstream Quad9 repository every day at 10:01 UTC, then triggers a fresh build and deploy. The site updates automatically without any manual steps.

The four main views (daily, monthly, quarterly, yearly) share a common table component with sticky columns for rank and domain name. On narrow screens the domain column is capped at half the viewport width with truncation. A single tap expands a truncated domain to its full text; a second tap opens it in a new browser tab.

Compare mode lets you place two periods side by side. The table shows both ranks and a delta column indicating how much a domain moved between the two periods. Domains that appear in one period but not the other are marked as new or absent.

## Facts

The facts view runs a full scan over the entire dataset client-side and surfaces things that are hard to see in a daily table.

**Consistency.** Which domains appear most reliably? No domain has appeared in every single day of data. Even large platforms like `google.com` or `microsoft.com` have days where they fall outside the top 500. The most consistent domains hover around 89 to 95 percent coverage across the available history.

**TLD breakdown.** The `.com` TLD dominates by a wide margin, but the distribution of other TLDs is interesting. Country-code TLDs, newer gTLDs, and infrastructure domains each carve out a small but consistent share.

**Domain length.** Most domains in the top 500 cluster between 5 and 15 characters in the label (the part before the TLD). The shortest are two or three characters. The longest are full phrases or product names that somehow still drive enough query volume to land in the top 500 globally.

**Day-of-week patterns.** Some domains rank consistently higher on weekdays than weekends, or vice versa. Video streaming and social platforms tend to peak on evenings and weekends. Enterprise and productivity tools lean toward weekdays. The patterns are subtle but visible when you average ranks across hundreds of weeks of data.

All of this runs in the browser on the cached `all.bin` buffer, with no additional fetches required after the initial load.

## Source

The data comes from the [Quad9DNS/quad9-domains-top500](https://github.com/Quad9DNS/quad9-domains-top500) repository. The dashboard source is at [2u841r/quad9-domains-top500](https://github.com/2u841r/quad9-domains-top500).
