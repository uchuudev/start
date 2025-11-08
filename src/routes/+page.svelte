<script lang="ts">
	import CurrencyBox from '$lib/components/currency-box.svelte';
	import CountdownWidget from '$lib/components/countdown-widget.svelte';
	import DateTime from '$lib/components/date-time.svelte';
	import TopSites from '$lib/components/top-sites.svelte';
</script>

<svelte:head>
	<title>Launchpad</title>
</svelte:head>

<main class="relative min-h-screen overflow-hidden bg-background text-foreground">
	<div
		class="pointer-events-none absolute inset-0"
		style="background: radial-gradient(circle at top, color-mix(in oklch, var(--color-primary) 28%, transparent), transparent 60%);"
	></div>
	<div
		class="pointer-events-none absolute inset-x-0 bottom-0 h-64"
		style="background: linear-gradient(to top, var(--color-background), color-mix(in oklch, var(--color-background) 70%, transparent), transparent);"
	></div>

	<div class="relative mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12">
		<section class="grid gap-6 items-center lg:grid-cols-[2fr_1fr]">
			<div class="space-y-4 text-center sm:text-left">
				<p class="text-xs uppercase tracking-[0.4em] text-muted-foreground">Your personal launch sequence</p>
				<h1 class="text-2xl font-semibold leading-tight sm:text-3xl" title="Pin essential destinations, skim the markets, and keep the next milestone within reach">Good things start from a clear cockpit.</h1>
			</div>

			<div class="mx-auto sm:mx-0">
				<DateTime />
			</div>
		</section>

		<div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
			<TopSites />
	    <div class="flex flex-col gap-6">
				<CurrencyBox />
				<CountdownWidget />
			</div>
		</div>
	</div>
</main>
