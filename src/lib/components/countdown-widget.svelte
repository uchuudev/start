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

	let events = $state<CountdownEvent[]>([]);
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
		return (
			events
				.map((event) => ({ event, time: Date.parse(event.occursAt) }))
				.filter((entry) => Number.isFinite(entry.time) && entry.time >= currentTime)
				.sort((a, b) => a.time - b.time)
				.map((entry) => entry.event)
				.at(0) ?? null
		);
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
		events.slice().sort((a, b) => Date.parse(a.occursAt) - Date.parse(b.occursAt))
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

<section class="rounded-2xl border border-border/50 bg-card p-5">
	<header class="mb-4 flex items-center justify-between">
		<h2 class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Next Up</h2>
		<div class="flex items-center gap-2">
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

	{#if nextEvent && countdown}
		<div class="space-y-4">
			<div>
				<h3 class="text-base font-semibold text-foreground">{nextEvent.title}</h3>
				<p class="text-xs text-muted-foreground">
					{displayFormatter.format(new Date(nextEvent.occursAt))}
				</p>
			</div>

			<div class="grid grid-cols-4 gap-2">
				<div class="rounded-xl bg-primary/5 px-2 py-3 text-center">
					<p class="text-xl font-semibold tabular-nums text-foreground">{countdown.days}</p>
					<p class="text-[10px] uppercase tracking-wide text-muted-foreground">Days</p>
				</div>
				<div class="rounded-xl bg-primary/5 px-2 py-3 text-center">
					<p class="text-xl font-semibold tabular-nums text-foreground">{pad(countdown.hours)}</p>
					<p class="text-[10px] uppercase tracking-wide text-muted-foreground">Hrs</p>
				</div>
				<div class="rounded-xl bg-primary/5 px-2 py-3 text-center">
					<p class="text-xl font-semibold tabular-nums text-foreground">{pad(countdown.minutes)}</p>
					<p class="text-[10px] uppercase tracking-wide text-muted-foreground">Min</p>
				</div>
				<div class="rounded-xl bg-primary/5 px-2 py-3 text-center">
					<p class="text-xl font-semibold tabular-nums text-foreground">{pad(countdown.seconds)}</p>
					<p class="text-[10px] uppercase tracking-wide text-muted-foreground">Sec</p>
				</div>
			</div>

			{#if nextEvent.notes}
				<p class="text-xs text-muted-foreground">{nextEvent.notes}</p>
			{/if}
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center py-8 text-center">
			<div class="mb-2 rounded-full bg-muted/50 p-2.5">
				<svg
					class="h-5 w-5 text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<p class="text-sm text-muted-foreground">No upcoming events</p>
		</div>
	{/if}

	{#if showEditor}
		<form class="mt-5 space-y-4 border-t border-border/50 pt-5" onsubmit={handleAdd}>
			<div class="space-y-3">
				<div class="space-y-1.5">
					<label for="countdown-title" class="text-xs font-medium text-muted-foreground"
						>Title</label
					>
					<input
						id="countdown-title"
						type="text"
						placeholder="What are you counting down to?"
						bind:value={draftTitle}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="countdown-date" class="text-xs font-medium text-muted-foreground"
						>Date & time</label
					>
					<input
						id="countdown-date"
						type="datetime-local"
						bind:value={draftAt}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="countdown-notes" class="text-xs font-medium text-muted-foreground"
						>Notes (optional)</label
					>
					<textarea
						id="countdown-notes"
						rows="2"
						bind:value={draftNotes}
						placeholder="Context, location, meeting link..."
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
					></textarea>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<button
					type="submit"
					class="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Save
				</button>
				<button
					type="button"
					onclick={() => {
						draftTitle = '';
						draftAt = '';
						draftNotes = '';
						feedback = null;
					}}
					class="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					Clear
				</button>
			</div>

			{#if sortedEvents.length}
				<ul class="space-y-2">
					{#each sortedEvents as eventItem (eventItem.id)}
						<li
							class="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5"
						>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-foreground">{eventItem.title}</p>
								<p class="text-xs text-muted-foreground">
									{displayFormatter.format(new Date(eventItem.occursAt))}
								</p>
							</div>
							<div class="flex shrink-0 items-center gap-2">
								<span class="text-xs text-muted-foreground">{relativeLabel(eventItem.occursAt)}</span
								>
								<button
									type="button"
									onclick={() => removeEvent(eventItem.id)}
									class="rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
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
