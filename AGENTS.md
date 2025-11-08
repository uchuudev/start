# AGENT GUIDELINES
- Repository: SvelteKit 2 + Svelte 5, Bun-managed dependencies (bun.lock).
- Install dependencies with `bun install`; avoid mixing npm or pnpm.
- Dev server via `bun run dev`; production build with `bun run build`.
- Type and lint checks through `bun run check` (runs `svelte-check`).
- Tests are not configured; after adding Vitest use `bunx vitest path/to.test.ts` for single cases.
- For file-scoped diagnostics, run `bunx svelte-check src/routes/+page.svelte`.
- No Cursor or Copilot rule files exist as of 2025-11-08.
- Formatting: keep Svelte/TS defaults (tab indents, LF newlines, trailing semicolons).
- Prefer single quotes in TS/JS, double quotes in JSON, HTML attributes follow DOM casing.
- Order imports: external packages, `$lib` aliases, then relative paths with blank separations.
- Maintain ES module syntax; default to named exports over namespace objects.
- Author Svelte components with `lang="ts"` and Svelte 5 runes such as `$props` / `{@render}`.
- Name Svelte components in PascalCase; route directories stay lowercase with plus files.
- Provide explicit return types for exported functions and leverage `satisfies` for configs.
- Narrow types for props, load data, and action payloads; avoid `any`.
- Handle failures via SvelteKit `error` or `redirect`; log only when actionable.
- Tailwind is available through Vite; prefer utility classes before authoring bespoke CSS.
- Keep assets under `src/lib/assets`; import static resources via `$lib` aliases.
- Before merging, run `bun run check` and `bun run build` to catch regressions.

--

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.