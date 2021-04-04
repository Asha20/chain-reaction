import m from "mithril";
import { getPlayerMeta, JsPlayerName, playersJS, playersWASM } from "@game";
import { State, StateEmitter } from "@ui/state";

interface SelectAttrs {
	id: string;
	disabled: boolean;
	value: string;
	options: Array<{ value: string; name: string }>;
	onChange(value: string): void;
}

const Select: m.Component<SelectAttrs> = {
	view(vnode) {
		const { onChange, options, id, disabled, value } = vnode.attrs;

		return m(
			"select",
			{
				id,
				disabled,
				onupdate(vnode: m.VnodeDOM) {
					(vnode.dom as HTMLSelectElement).value = value;
				},
				onchange: (e: Event) => {
					if (!disabled) {
						onChange((e.target as HTMLSelectElement).value);
					}
				},
			},
			options.map(({ name, value }) => m("option", { value }, name)),
		);
	},
};

function playerIdToOption(id: Parameters<typeof getPlayerMeta>[0]) {
	const meta = getPlayerMeta(id);
	return { value: meta.id, name: meta.name };
}

const playersJSOptions = playersJS.map(playerIdToOption);
const playersWASMOptions = playersWASM.map(playerIdToOption);

interface PlayersAttrs {
	disabled: boolean;
	state: State;
	$state: StateEmitter;
}

export const Players: m.Component<PlayersAttrs> = {
	view(vnode) {
		const { disabled, state, $state } = vnode.attrs;

		const playersArray = state.wasm
			? state.game.players.wasm
			: state.game.players.js;

		const PlayerSelect = (value: string, id: number) =>
			m(".config__field--2.config__field--select", { key: id }, [
				m("label", { for: `player-${id}` }, `Player ${id + 1}:`),

				m(Select, {
					id: `player-${id}`,
					disabled,
					value,
					options: state.wasm ? playersWASMOptions : playersJSOptions,
					onChange: x =>
						$state.emit(
							state.wasm ? "updatePlayerWASM" : "updatePlayerJS",
							id,
							x as JsPlayerName,
						),
				}),
			]);

		return m(".players", [m("h3", "Players"), playersArray.map(PlayerSelect)]);
	},
};
