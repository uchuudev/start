<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	type TopSite = {
		title: string;
		url: string;
		favicon?: string;
		screenshot?: string;
	};

	const STORAGE_KEY = 'startpage.topSites';

	const defaultSites: ReadonlyArray<TopSite> = [
		{ title: 'Svelte', url: 'https://svelte.dev' },
		{ title: 'GitHub', url: 'https://github.com' },
		{ title: 'MDN', url: 'https://developer.mozilla.org' },
		{ title: 'OpenAI', url: 'https://openai.com' }
	];

	function createDefaultSites(): TopSite[] {
		return defaultSites.map((site) => ({ ...site }));
	}

	let sites = $state<TopSite[]>(createDefaultSites());
	let showEditor = $state(false);
	let draftTitle = $state('');
	let draftUrl = $state('https://');
	let feedback = $state<string | null>(null);

	onMount(() => {
		if (!browser) {
			return;
		}

		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return;
		}

		try {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed)) {
				const filtered = parsed.filter(isTopSite).map((site) => ({
					title: site.title,
					url: site.url,
					favicon: site.favicon,
					screenshot: site.screenshot
				}));

				if (filtered.length) {
					sites = filtered;
					persist(filtered);
				}
			}
		} catch {
			feedback = 'Reset stored sites due to invalid data.';
			localStorage.removeItem(STORAGE_KEY);
		}
	});

	function persist(value: TopSite[]): void {
		if (!browser) {
			return;
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify($state.snapshot(value)));
	}

	function isTopSite(value: unknown): value is TopSite {
		if (typeof value !== 'object' || value === null) {
			return false;
		}

		const record = value as Record<string, unknown>;
		return (
			typeof record.title === 'string' &&
			typeof record.url === 'string' &&
			(record.favicon === undefined || typeof record.favicon === 'string') &&
			(record.screenshot === undefined || typeof record.screenshot === 'string')
		);
	}

	function normalizeUrl(raw: string): string | null {
		const candidate = raw.trim();
		if (!candidate) {
			return null;
		}

		try {
			const url = new URL(candidate);
			if (url.protocol === 'http:' || url.protocol === 'https:') {
				return url.toString();
			}

			return null;
		} catch {
			try {
				const url = new URL(`https://${candidate}`);
				return url.toString();
			} catch {
				return null;
			}
		}
	}

	function handleAddSite(event: SubmitEvent) {
		event.preventDefault();
		feedback = null;

		const title = draftTitle.trim();
		const normalizedUrl = normalizeUrl(draftUrl);

		if (!title || !normalizedUrl) {
			feedback = 'Provide a title and a valid https:// URL.';
			return;
		}

		const existingIndex = sites.findIndex((site) => site.url === normalizedUrl);
		const next: TopSite[] = existingIndex >= 0
			? sites.map((site, index) => (index === existingIndex ? { ...site, title } : site))
			: [...sites, { title, url: normalizedUrl }];

		sites = next;
		draftTitle = '';
		draftUrl = 'https://';
		persist(next);
		feedback = 'Link saved';
	}

	function removeSite(targetUrl: string) {
		const updated = sites.filter((site) => site.url !== targetUrl);
		sites = updated;
		persist(updated);
		feedback = 'Link removed';
	}

	function clearAll() {
		const reset = createDefaultSites();
		sites = reset;
		persist(reset);
		feedback = 'Reset to defaults';
	}

	function getFaviconUrl(site: TopSite): string {
		if (site.favicon) {
			return site.favicon;
		}

		try {
			const url = new URL(site.url);
			return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(url.origin)}`;
		} catch {
			return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(site.url)}`;
		}
	}

	function getHost(url: string): string {
		try {
			return new URL(url).hostname.replace(/^www\./, '');
		} catch {
			return url;
		}
	}
</script>

<section class="flex flex-col gap-4 rounded-xl bg-card/80 p-6 text-card-foreground shadow-lg backdrop-blur">
	<header class="flex items-center justify-between">
		<h2 class="text-sm uppercase tracking-[0.35em] text-muted-foreground">Top Sites</h2>
		<div class="flex items-center gap-2">
			{#if feedback}
				<p class="text-xs text-primary">{feedback}</p>
			{/if}
			<button
				type="button"
				onclick={() => (showEditor = !showEditor)}
				class="rounded-full border border-border/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-foreground transition hover:border-border hover:text-foreground/80"
			>
				{showEditor ? 'Done' : 'Edit'}
			</button>
		</div>
	</header>

	{#if sites.length === 0}
		<p class="rounded-lg bg-card/70 px-4 py-6 text-center text-sm text-muted-foreground">Use Edit to add your go-to sites.</p>
	{:else}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
			{#each sites as site (site.url)}
				<a
					href={site.url}
					target="_blank"
					rel="noopener noreferrer"
					class="group flex flex-col items-center gap-3 rounded-2xl bg-card/70 p-4 text-center transition hover:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
				>
					<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40 transition group-hover:bg-muted/60">
						<img
							height="40"
							width="40"
							class="h-10 w-10"
							src={getFaviconUrl(site)}
							alt={`Favicon for ${site.title}`}
							loading="lazy"
						/>
					</div>
					<div class="space-y-1">
						<p class="text-sm font-semibold text-foreground group-hover:text-primary">{site.title}</p>
						<p class="text-xs text-muted-foreground">{getHost(site.url)}</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}

	{#if showEditor}
		<form class="mt-2 flex flex-col gap-4 rounded-lg bg-popover/40 p-4" onsubmit={handleAddSite}>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
					<span>Title</span>
					<input
						type="text"
						placeholder="Display name"
						bind:value={draftTitle}
						class="rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm text-foreground focus:border-border focus:outline-none"
					/>
				</label>
				<label class="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
					<span>URL</span>
					<input
						type="url"
						placeholder="https://example.com"
						bind:value={draftUrl}
						class="rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm text-foreground focus:border-border focus:outline-none"
					/>
				</label>
			</div>

			<div class="flex flex-wrap items-center gap-3">
				<button
					type="submit"
					class="rounded-full bg-primary/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary transition hover:bg-primary/30"
				>
					Save Link
				</button>
				<button
					type="button"
					onclick={() => {
						draftTitle = '';
						draftUrl = 'https://';
						feedback = null;
					}}
					class="rounded-full border border-border/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-foreground transition hover:border-border"
				>
					Clear
				</button>
				<button
					type="button"
					onclick={clearAll}
					class="rounded-full border border-destructive/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-destructive transition hover:border-destructive"
				>
					Reset Defaults
				</button>
			</div>

			{#if sites.length}
				<ul class="flex flex-col gap-2 text-sm">
					{#each sites as site (site.url)}
						<li class="flex items-center justify-between rounded-lg border border-border/60 px-4 py-2">
							<div>
								<p class="font-medium text-foreground">{site.title}</p>
								<p class="text-xs text-muted-foreground">{site.url}</p>
							</div>
							<button
								type="button"
								onclick={() => removeSite(site.url)}
								class="rounded-full border border-destructive/50 px-3 py-1 text-xs uppercase tracking-[0.3em] text-destructive transition hover:border-destructive"
							>
								Remove
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</form>
	{/if}
</section>
