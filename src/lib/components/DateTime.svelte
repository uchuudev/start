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
		minute: '2-digit',
		second: '2-digit'
	});

	onMount(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<div class="flex flex-col items-center gap-2 rounded-xl bg-card/80 p-6 text-center text-card-foreground shadow-lg backdrop-blur">
	<p class="text-4xl font-semibold tracking-widest text-foreground">{timeFormatter.format(now)}</p>
	<p class="text-sm uppercase tracking-[0.35em] text-muted-foreground">{dateFormatter.format(now)}</p>
</div>
