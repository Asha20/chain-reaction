import m from "mithril";
import { restrict } from "../game/ts/util";

interface NumberInputAttrs {
	label: string;
	defaultValue: number;
	min: number;
	max: number;

	onChange(value: number): void;
}

export const NumberInput: m.FactoryComponent<NumberInputAttrs> = ({
	attrs,
}) => {
	const { min, max, onChange } = attrs;
	let oldValue = attrs.defaultValue;
	let value = String(attrs.defaultValue);
	let editing = false;

	function setEditing() {
		editing = true;
	}

	function setValue(e: InputEvent) {
		const newValue = (e.target as HTMLInputElement).value;
		value = newValue;
	}

	function saveValueOnEnter(e: KeyboardEvent) {
		if (editing && e.key === "Enter") {
			editing = false;
			submitValue();
		}
	}

	function saveValue() {
		if (editing) {
			editing = false;
			submitValue();
		}
	}

	function submitValue() {
		const newValue = restrict(min, max)(Number(value));
		if (!Number.isNaN(newValue)) {
			if (newValue !== oldValue) {
				oldValue = newValue;
				onChange(newValue);
			}
		}

		value = String(oldValue);
	}

	return {
		view(vnode) {
			const { label } = vnode.attrs;

			if (editing) {
				return m(
					"label",
					label,
					m("input[type=text].number-input", {
						value,
						oncreate: ({ dom }) => (dom as HTMLInputElement).focus(),
						oninput: setValue,
						onkeypress: saveValueOnEnter,
						onblur: saveValue,
					}),
				);
			}

			return m("span", label, m("button", { onclick: setEditing }, value));
		},
	};
};
