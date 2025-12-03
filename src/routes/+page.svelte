<script lang="ts">
	import type { PageData } from './$types';

	import CurrencyBox from '$lib/components/currency-box.svelte';
	import CountdownWidget from '$lib/components/countdown-widget.svelte';
	import DateTime from '$lib/components/date-time.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import TopSites from '$lib/components/top-sites.svelte';

	const props = $props<{ data: PageData }>();
	const data = $derived(props.data);
</script>

<svelte:head>
	<title>Start</title>
</svelte:head>

<main class="min-h-screen bg-background">
	<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- Header -->
		<header class="mb-12 flex items-center justify-between">
			<DateTime />
			<ThemeToggle />
		</header>

		<!-- Main Grid -->
		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Top Sites - spans 2 columns on large screens -->
			<div class="lg:col-span-2">
				<TopSites />
			</div>

			<!-- Sidebar widgets -->
			<div class="flex flex-col gap-6">
				<CurrencyBox rates={data.rates} />
				<CountdownWidget />
			</div>
		</div>
	</div>
</main>
