type ImmutablePrimitive =
	| undefined
	| null
	| boolean
	| string
	| number
	// eslint-disable-next-line @typescript-eslint/ban-types
	| Function;

export type Immutable<T> = T extends ImmutablePrimitive
	? T
	: T extends Array<infer U>
	? ImmutableArray<U>
	: T extends Map<infer K, infer V>
	? ImmutableMap<K, V>
	: T extends Set<infer M>
	? ImmutableSet<M>
	: ImmutableObject<T>;

type ImmutableArray<T> = ReadonlyArray<Immutable<T>>;
type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
type ImmutableObject<T> = { readonly [K in keyof T]: Immutable<T[K]> };

export function restrict(value: number, min: number, max: number): number {
	const boundHigh = Math.min(value, max);
	return Math.max(boundHigh, min);
}

export function classNames(obj: Record<string, boolean>): string {
	return Object.keys(obj)
		.map(key => (obj[key] ? key : ""))
		.join(" ");
}

export const supportsWasm = (() => {
	// https://stackoverflow.com/questions/47879864
	try {
		if (
			typeof WebAssembly === "object" &&
			typeof WebAssembly.instantiate === "function"
		) {
			const module = new WebAssembly.Module(
				Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00),
			);
			if (module instanceof WebAssembly.Module)
				return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
		}
		// eslint-disable-next-line no-empty
	} catch (e) {}
	return false;
})();
