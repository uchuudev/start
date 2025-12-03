<script lang="ts">
	import { onMount } from 'svelte';

	let now = $state(new Date());

	const dateFormatter = new Intl.DateTimeFormat('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

	const timeFormatter = new Intl.DateTimeFormat('en-GB', {
		hour: '2-digit',
		minute: '2-digit'
	});

	onMount(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<div class="flex items-baseline gap-3">
	<time class="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
		{timeFormatter.format(now)}
	</time>
	<span class="text-sm text-muted-foreground">
		{dateFormatter.format(now)}
	</span>
</div>
