<script lang="ts">
	import { currencyBoxConfig, type CurrencyBoxRates } from './currency-box.config';

	const props = $props<{ rates?: CurrencyBoxRates | null }>();

	const placeholderRates: CurrencyBoxRates = {
		base: currencyBoxConfig.base,
		conversions: currencyBoxConfig.conversions.map((conversion) => ({
			...conversion,
			amount: '--',
			label: `Awaiting ${conversion.currency} rate`
		})),
		updatedAt: 'Awaiting rates'
	};

	const rates = $derived<CurrencyBoxRates>(props.rates ?? placeholderRates);
</script>

<section class="rounded-2xl border border-border/50 bg-card p-5">
	<header class="mb-4 flex items-center justify-between">
		<h2 class="text-xs font-medium uppercase tracking-wider text-muted-foreground">FX Rates</h2>
		<span class="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
			{rates.updatedAt}
		</span>
	</header>

	<div class="mb-4">
		<p class="text-2xl font-semibold tabular-nums text-foreground">
			{rates.base.symbol}{rates.base.amount}
			<span class="text-sm font-normal text-muted-foreground">{rates.base.currency}</span>
		</p>
	</div>

	<ul class="space-y-2">
		{#each rates.conversions as conversion (conversion.currency)}
			<li class="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5">
				<div>
					<p class="text-base font-semibold tabular-nums text-foreground">
						{conversion.symbol}{conversion.amount}
					</p>
					<p class="text-[10px] uppercase tracking-wide text-muted-foreground">
						{conversion.currency}
					</p>
				</div>
				<span class="text-xs text-muted-foreground">{conversion.label}</span>
			</li>
		{/each}
	</ul>
</section>
