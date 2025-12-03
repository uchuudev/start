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

	let sites = $state<TopSite[]>([]);
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
		const next: TopSite[] =
			existingIndex >= 0
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
		sites = [];
		persist([]);
		feedback = 'Cleared all links';
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

<section class="rounded-2xl border border-border/50 bg-card p-6">
	<header class="mb-5 flex items-center justify-between">
		<h2 class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Top Sites</h2>
		<div class="flex items-center gap-3">
			{#if feedback}
				<span class="text-xs text-primary">{feedback}</span>
			{/if}
			<button
				type="button"
				onclick={() => (showEditor = !showEditor)}
				class="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
			>
				{showEditor ? 'Done' : 'Edit'}
			</button>
		</div>
	</header>

	{#if sites.length === 0}
		<div class="flex flex-col items-center justify-center py-12 text-center">
			<div class="mb-3 rounded-full bg-muted/50 p-3">
				<svg
					class="h-6 w-6 text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
					/>
				</svg>
			</div>
			<p class="text-sm text-muted-foreground">Add your favorite sites</p>
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			{#each sites as site (site.url)}
				<a
					href={site.url}
					class="group flex flex-col items-center gap-2.5 rounded-xl p-4 transition-colors hover:bg-accent/50"
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/30 transition-colors group-hover:bg-muted/50"
					>
						<img
							height="28"
							width="28"
							class="h-7 w-7"
							src={getFaviconUrl(site)}
							alt=""
							loading="lazy"
						/>
					</div>
					<div class="w-full text-center">
						<p class="truncate text-sm font-medium text-foreground">{site.title}</p>
						<p class="truncate text-xs text-muted-foreground">{getHost(site.url)}</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}

	{#if showEditor}
		<form class="mt-6 space-y-4 border-t border-border/50 pt-6" onsubmit={handleAddSite}>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1.5">
					<label for="title" class="text-xs font-medium text-muted-foreground">Title</label>
					<input
						id="title"
						type="text"
						placeholder="Display name"
						bind:value={draftTitle}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="url" class="text-xs font-medium text-muted-foreground">URL</label>
					<input
						id="url"
						type="url"
						placeholder="https://example.com"
						bind:value={draftUrl}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
					/>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<button
					type="submit"
					class="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
					class="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					Clear
				</button>
				{#if sites.length > 0}
					<button
						type="button"
						onclick={clearAll}
						class="rounded-lg px-4 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
					>
						Clear All
					</button>
				{/if}
			</div>

			{#if sites.length}
				<ul class="space-y-2">
					{#each sites as site (site.url)}
						<li
							class="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-3"
						>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-foreground">{site.title}</p>
								<p class="truncate text-xs text-muted-foreground">{site.url}</p>
							</div>
							<button
								type="button"
								onclick={() => removeSite(site.url)}
								class="ml-3 shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
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
