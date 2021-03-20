export interface EventEmitter<T extends Record<string, EventHandler>> {
	on<K extends keyof T>(event: K[], handler: () => void): () => void;
	on<K extends keyof T>(event: K, handler: T[K]): () => void;

	once<K extends keyof T>(event: K[], handler: () => void): () => void;
	once<K extends keyof T>(event: K, handler: T[K]): () => void;

	off<K extends keyof T>(event: K, handler: T[K]): void;
	emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void;
}

type EventHandler = (...args: never[]) => void;
export function EventEmitter<
	T extends Record<string, EventHandler>
>(): EventEmitter<T> {
	const handlers = {} as Record<
		keyof T,
		Array<{ handler: EventHandler; once: boolean }>
	>;

	function removeHandler<K extends keyof T>(
		event: K,
		handler: T[K] | (() => void),
	) {
		const index = handlers[event].findIndex(x => x.handler === handler);
		if (index > -1) {
			handlers[event].splice(index, 1);
		}
	}

	function addHandler<K extends keyof T>(
		event: K,
		handler: T[K] | (() => void),
		once: boolean,
	) {
		if (!handlers[event]) {
			handlers[event] = [];
		}

		handlers[event].push({ handler, once });
		return () => removeHandler(event, handler);
	}

	function addHandlers<K extends Array<keyof T>>(
		events: K,
		handler: T[K[number]] | (() => void),
		once: boolean,
	) {
		const unsubscribes: Array<() => void> = [];
		for (const event of events) {
			unsubscribes.push(addHandler(event, handler, once));
		}

		return () => unsubscribes.forEach(fn => fn());
	}

	return {
		on<K extends keyof T>(event: K | K[], handler: T[K] | (() => void)) {
			return Array.isArray(event)
				? addHandlers(event, handler, false)
				: addHandler(event, handler, false);
		},

		once<K extends keyof T>(event: K | K[], handler: T[K] | (() => void)) {
			return Array.isArray(event)
				? addHandlers(event, handler, true)
				: addHandler(event, handler, true);
		},

		off(event, handler) {
			return removeHandler(event, handler);
		},

		emit(event, ...args) {
			for (const { handler, once } of handlers[event] ?? []) {
				handler(...args);
				if (once) {
					this.off(event, handler as T[typeof event]);
				}
			}
		},
	};
}
