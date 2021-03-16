type Unsubscribe = () => void;
type HookFn = () => unknown;

export interface Hooks<TEvent extends string> {
	add(event: TEvent, handler: HookFn): Unsubscribe;
	run(event: TEvent, timeout?: Promise<unknown>): Promise<void>;
	clear(event?: TEvent): void;
	has(x: string): x is TEvent;
}

export function Hooks<TEvent extends string>(
	...events: TEvent[]
): Hooks<TEvent> {
	const hooks = {} as Record<TEvent, HookFn[]>;
	for (const event of events) {
		hooks[event] = [];
	}

	const eventSet = new Set(events);

	function unsubscriber(event: TEvent, handler: HookFn) {
		return function _unsubscriber() {
			const index = hooks[event].indexOf(handler);
			if (index > -1) {
				hooks[event].splice(index, 1);
			}
		};
	}

	return {
		add(event, handler) {
			hooks[event].push(handler);
			return unsubscriber(event, handler);
		},

		run(event, timeout) {
			const hooksPromise = Promise.all(hooks[event].map(fn => fn()));

			const runPromise =
				timeout === undefined
					? hooksPromise
					: Promise.race([timeout, hooksPromise]);

			return runPromise as Promise<void>;
		},

		clear(this: Hooks<TEvent>, event) {
			if (event === undefined) {
				events.forEach(event => this.clear(event));
				return;
			}

			hooks[event] = [];
		},

		has(event): event is TEvent {
			return eventSet.has(event as TEvent);
		},
	};
}

export function extendHooks<
	TBaseEvent extends string,
	TNewEvent extends string
>(
	base: Hooks<TBaseEvent>,
	...events: TNewEvent[]
): Hooks<TBaseEvent | TNewEvent> {
	type Event = TNewEvent | TBaseEvent;

	const newHooks = Hooks(...events);

	return {
		add(event, handler) {
			return base.has(event)
				? base.add(event, handler)
				: newHooks.add(event, handler);
		},

		run(event, timeout) {
			return base.has(event)
				? base.run(event, timeout)
				: newHooks.run(event, timeout);
		},

		clear(this: Hooks<Event>, event) {
			if (event === undefined) {
				base.clear();
				newHooks.clear();
				return;
			}

			return base.has(event) ? base.clear(event) : newHooks.clear(event);
		},

		has(event): event is Event {
			return base.has(event) || newHooks.has(event);
		},
	};
}
