<script lang="ts">
	const mockRates = {
		base: {
			currency: 'GBP',
			symbol: '£',
			amount: '1.00'
		},
		conversions: [
			{ currency: 'USD', symbol: '$', amount: '1.00', label: 'Mock parity' },
			{ currency: 'JPY', symbol: '¥', amount: '1000', label: 'Mock placeholder' }
		],
		updatedAt: 'a moment ago'
	};
</script>

<section class="flex flex-col gap-4 rounded-xl bg-card/80 p-6 text-card-foreground shadow-lg backdrop-blur">
	<header class="flex items-center justify-between text-sm uppercase tracking-[0.35em] text-muted-foreground">
		<span>FX Snapshot</span>
	</header>

	<div class="flex items-baseline gap-3">
		<p class="text-3xl font-semibold text-foreground">{mockRates.base.symbol}{mockRates.base.amount}</p>
		<span class="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
      <time aria-label="Mocked update time">{mockRates.updatedAt}</time>
    </span>
	</div>

	<ul class="flex flex-col gap-3 text-sm">
		{#each mockRates.conversions as conversion (conversion.currency)}
			<li class="flex items-center justify-between rounded-lg bg-card/70 px-4 py-3">
				<div class="flex flex-col">
					<span class="text-lg font-semibold text-foreground">{conversion.symbol}{conversion.amount}</span>
					<span class="text-xs uppercase tracking-[0.25em] text-muted-foreground">{conversion.currency}</span>
				</div>
				<span class="text-xs text-muted-foreground">{conversion.label}</span>
			</li>
		{/each}
	</ul>

	<p class="text-xs text-muted-foreground">All values are placeholders until live rates are wired up.</p>
</section>
