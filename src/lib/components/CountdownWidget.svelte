<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	type CountdownEvent = {
		id: string;
		title: string;
		occursAt: string;
		notes?: string;
	};

	const STORAGE_KEY = 'startpage.countdowns';

	function createId(): string {
		if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
			return crypto.randomUUID();
		}

		return Math.random().toString(36).slice(2);
	}

	function createDefaultEvents(): CountdownEvent[] {
		const occursAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

		return [
			{
				id: createId(),
				title: 'Next focus block',
				occursAt,
				notes: 'Adjust in the editor below to match your schedule.'
			}
		];
	}

	let events = $state<CountdownEvent[]>(createDefaultEvents());
	let now = $state(Date.now());
	let showEditor = $state(false);
	let draftTitle = $state('');
	let draftAt = $state('');
	let draftNotes = $state('');
	let feedback = $state<string | null>(null);

	const displayFormatter = new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	const relativeFormatter = new Intl.RelativeTimeFormat('en', {
		numeric: 'auto'
	});

	onMount(() => {
		if (!browser) {
			return;
		}

		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				if (Array.isArray(parsed)) {
					const sanitized = parsed.filter(isCountdownEvent).map((entry) => ({
						id: entry.id ?? createId(),
						title: entry.title,
						occursAt: entry.occursAt,
						notes: entry.notes
					}));

					if (sanitized.length) {
						events = sanitized;
					}
				}
			} catch {
				feedback = 'Countdown data reset due to invalid storage.';
				localStorage.removeItem(STORAGE_KEY);
			}
		}

		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);

		return () => clearInterval(interval);
	});

	function persist(value: CountdownEvent[]): void {
		if (!browser) {
			return;
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify($state.snapshot(value)));
	}

	function isCountdownEvent(value: unknown): value is CountdownEvent {
		if (typeof value !== 'object' || value === null) {
			return false;
		}

		const record = value as Record<string, unknown>;
		return (
			typeof record.title === 'string' &&
			typeof record.occursAt === 'string' &&
			(record.notes === undefined || typeof record.notes === 'string')
		);
	}

	const nextEvent = $derived.by((): CountdownEvent | null => {
		const currentTime = now;
		return events
			.map((event) => ({ event, time: Date.parse(event.occursAt) }))
			.filter((entry) => Number.isFinite(entry.time) && entry.time >= currentTime)
			.sort((a, b) => a.time - b.time)
			.map((entry) => entry.event)
			.at(0) ?? null;
	});

	type CountdownBreakdown = {
		target: number;
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
	};

	const countdown = $derived.by((): CountdownBreakdown | null => {
		if (!nextEvent) {
			return null;
		}

		const target = Date.parse(nextEvent.occursAt);
		if (!Number.isFinite(target)) {
			return null;
		}

		const diff = target - now;
		const totalSeconds = Math.max(0, Math.floor(diff / 1000));

		const days = Math.floor(totalSeconds / 86400);
		const hours = Math.floor((totalSeconds % 86400) / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		return {
			target,
			days,
			hours,
			minutes,
			seconds
		};
	});

	const sortedEvents = $derived.by((): CountdownEvent[] =>
		events
			.slice()
			.sort((a, b) => Date.parse(a.occursAt) - Date.parse(b.occursAt))
	);

	function handleAdd(event: SubmitEvent) {
		event.preventDefault();
		feedback = null;

		const title = draftTitle.trim();
		if (!title) {
			feedback = 'Give the countdown a title.';
			return;
		}

		if (!draftAt) {
			feedback = 'Pick when it should happen.';
			return;
		}

		const occursAt = new Date(draftAt);
		if (!Number.isFinite(occursAt.getTime())) {
			feedback = 'Use a valid date and time.';
			return;
		}

		if (occursAt.getTime() <= now) {
			feedback = 'Choose a time in the future.';
			return;
		}

		const newEvent: CountdownEvent = {
			id: createId(),
			title,
			occursAt: occursAt.toISOString(),
			notes: draftNotes.trim() || undefined
		};

		const nextEvents = [...events, newEvent];
		events = nextEvents;
		persist(nextEvents);

		draftTitle = '';
		draftAt = '';
		draftNotes = '';
		feedback = 'Countdown saved';
	}

	function removeEvent(id: string) {
		const nextEvents = events.filter((entry) => entry.id !== id);
		events = nextEvents;
		persist(nextEvents);
		feedback = 'Countdown removed';
	}

	function resetDefaults() {
		const defaults = createDefaultEvents();
		events = defaults;
		persist(defaults);
		feedback = 'Countdown reset';
	}

	function pad(value: number): string {
		return value.toString().padStart(2, '0');
	}

	function relativeLabel(input: string): string {
		const target = Date.parse(input);
		if (!Number.isFinite(target)) {
			return '';
		}

		const diffMs = target - now;
		const diffDays = diffMs / 86400000;
		if (Math.abs(diffDays) >= 2) {
			return relativeFormatter.format(Math.round(diffDays), 'day');
		}

		const diffHours = diffMs / 3600000;
		if (Math.abs(diffHours) >= 1) {
			return relativeFormatter.format(Math.round(diffHours), 'hour');
		}

		const diffMinutes = diffMs / 60000;
		return relativeFormatter.format(Math.round(diffMinutes), 'minute');
	}
</script>

<section class="flex flex-col gap-4 rounded-xl bg-card/80 p-6 text-card-foreground shadow-lg backdrop-blur">
	<header class="flex items-center justify-between">
		<h2 class="text-sm uppercase tracking-[0.35em] text-muted-foreground">Next Up</h2>
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

	{#if nextEvent && countdown}
		<article class="rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/15 p-6 text-center shadow-inner">
			<h3 class="text-lg font-semibold text-foreground">{nextEvent.title}</h3>
			<p class="text-sm text-muted-foreground">{displayFormatter.format(new Date(nextEvent.occursAt))}</p>

			<div class="mt-4 grid grid-cols-4 gap-3 text-foreground">
				<div class="rounded-xl bg-muted/30 px-3 py-4">
					<p class="text-3xl font-semibold">{countdown.days}</p>
					<p class="text-xs uppercase tracking-[0.3em] text-muted-foreground">Days</p>
				</div>
				<div class="rounded-xl bg-muted/30 px-3 py-4">
					<p class="text-3xl font-semibold">{pad(countdown.hours)}</p>
					<p class="text-xs uppercase tracking-[0.3em] text-muted-foreground">Hours</p>
				</div>
				<div class="rounded-xl bg-muted/30 px-3 py-4">
					<p class="text-3xl font-semibold">{pad(countdown.minutes)}</p>
					<p class="text-xs uppercase tracking-[0.3em] text-muted-foreground">Mins</p>
				</div>
				<div class="rounded-xl bg-muted/30 px-3 py-4">
					<p class="text-3xl font-semibold">{pad(countdown.seconds)}</p>
					<p class="text-xs uppercase tracking-[0.3em] text-muted-foreground">Secs</p>
				</div>
			</div>

			{#if nextEvent.notes}
				<p class="mt-4 text-xs text-muted-foreground">{nextEvent.notes}</p>
			{/if}
		</article>
	{:else}
		<p class="rounded-xl bg-card/70 px-6 py-8 text-center text-sm text-muted-foreground">
			No future countdowns yet. Add one below to keep it in view.
		</p>
	{/if}

	{#if showEditor}
		<form class="mt-2 flex flex-col gap-4 rounded-lg bg-popover/40 p-4" onsubmit={handleAdd}>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
					<span>Title</span>
					<input
						type="text"
						placeholder="What are you counting down to?"
						bind:value={draftTitle}
						class="rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm text-foreground focus:border-border focus:outline-none"
					/>
				</label>
				<label class="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
					<span>Date &amp; time</span>
					<input
						type="datetime-local"
						bind:value={draftAt}
						class="rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm text-foreground focus:border-border focus:outline-none"
					/>
				</label>
			</div>

			<label class="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
				<span>Notes (optional)</span>
				<textarea
					rows="2"
					bind:value={draftNotes}
					placeholder="Context, location, meeting link..."
					class="rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm text-foreground focus:border-border focus:outline-none"
				></textarea>
			</label>

			<div class="flex flex-wrap items-center gap-3">
				<button
					type="submit"
					class="rounded-full bg-primary/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary transition hover:bg-primary/30"
				>
					Save Countdown
				</button>
				<button
					type="button"
					onclick={() => {
						draftTitle = '';
						draftAt = '';
						draftNotes = '';
						feedback = null;
					}}
					class="rounded-full border border-border/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-foreground transition hover:border-border"
				>
					Clear
				</button>
				<button
					type="button"
					onclick={resetDefaults}
					class="rounded-full border border-destructive/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-destructive transition hover:border-destructive"
				>
					Reset Defaults
				</button>
			</div>

			{#if sortedEvents.length}
				<ul class="flex flex-col gap-2 text-sm">
					{#each sortedEvents as eventItem (eventItem.id)}
						<li class="flex items-center justify-between rounded-lg border border-border/60 px-4 py-2">
							<div>
								<p class="font-medium text-foreground">{eventItem.title}</p>
								<p class="text-xs text-muted-foreground">{displayFormatter.format(new Date(eventItem.occursAt))}</p>
								{#if eventItem.notes}
									<p class="text-xs text-muted-foreground">{eventItem.notes}</p>
								{/if}
							</div>
							<div class="flex items-center gap-3">
								<p class="text-xs text-muted-foreground">{relativeLabel(eventItem.occursAt)}</p>
								<button
									type="button"
									onclick={() => removeEvent(eventItem.id)}
									class="rounded-full border border-destructive/50 px-3 py-1 text-xs uppercase tracking-[0.3em] text-destructive transition hover:border-destructive"
								>
									Remove
								</button>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</form>
	{/if}
</section>
