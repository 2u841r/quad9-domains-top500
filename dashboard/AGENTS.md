<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

---

## Project Context

### Scaffold command

```
npx @tanstack/cli@latest create my-tanstack-app --agent --package-manager pnpm --tailwind
```

Scaffolded in a scratch directory; only the SPA-compatible pieces were merged (see below).

### Follow-up commands

```
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
```

### Stack

- **React 19** + **Vite 8** SPA (no SSR)
- **TanStack Router** (file-based, `@tanstack/router-plugin` Vite plugin)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **JavaScript / JSX** (no TypeScript — `disableTypes: true` in tsr.config.json generates `routeTree.gen.js`)

### What was NOT merged from the scaffold

The TanStack CLI generated a **TanStack Start** (SSR) project. The following were intentionally excluded:
- `@tanstack/react-start` — SSR framework, not needed for this Vite SPA
- `@tanstack/react-router-ssr-query` — SSR-only
- `@tanstack/react-devtools` / `@tanstack/devtools-vite` — optional, add later if needed
- `shellComponent`, `HeadContent`, `Scripts` from `__root.tsx` — SSR document shell
- Server entry points and `tsconfig.json` — project stays pure JSX

### Route tree

| Path | File | Description |
|------|------|-------------|
| `/` | `index.jsx` | Homepage: daily/monthly/quarterly/yearly toggled by local state (default daily) |
| `/trend` | `trend.jsx` | Trend chart view |
| `/facts` | `facts.jsx` | Fun facts view |
| `/blog` | `blog.jsx` | Blog (rendered from `src/blog.md`) |
| `/$year/$month/$day` | `$year.$month.$day.jsx` | Direct link to a specific day e.g. `/2026/05/24` |
| `/$year/$month` | `$year.$month.jsx` | Direct link to a specific month e.g. `/2026/05` |

### Key files

- `src/routes/__root.jsx` — root layout (Header, ViewTabs nav, Outlet, Footer)
- `src/components/PeriodTableView.jsx` — period selection + data loading + DomainTable; shared by daily/monthly/quarterly/yearly routes and date-path routes
- `src/components/ViewTabs.jsx` — tab nav using TanStack Router `Link` with `activeProps`
- `src/routeTree.gen.js` — auto-generated, do not edit
- `tsr.config.json` — router config (`disableTypes: true`)
- `vite.config.js` — includes `tanstackRouter()` plugin (must be first)

### Route generation

Route tree is auto-regenerated on `vite dev` and `vite build` via the Vite plugin.  
Manual regeneration: `pnpm generate-routes` (runs `tsr generate`).

### Environment variables

None required. Data is fetched from `public/data/` at runtime via `import.meta.env.BASE_URL`.

### Known gotchas

- `tanstackRouter()` must be listed **before** `react()` in the Vite plugins array.
- `$year.$month.$day.jsx` flat-file dots map to path segments `/:year/:month/:day`. Static routes (`/daily`, `/blog`, etc.) take priority over dynamic `$year` segments.
- `routeTree.gen.js` is overwritten on every codegen run — keep custom code out of it.
- The `--tailwind` flag is deprecated in the CLI (Tailwind is always included); ignored in practice.

### Next steps

- Add `loader` on date-path routes to prefetch data server-side (if SSR added later)
- Add `validateSearch` for period search params on `/daily` etc. for shareable period URLs
- Add `notFoundComponent` to `__root.jsx` for 404 handling
- Consider `@tanstack/react-query` integration for caching fetched period data
