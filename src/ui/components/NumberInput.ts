import m from "mithril";
import { restrict } from "@ui/util";

interface NumberInputAttrs {
	id: string;
	label: string;
	defaultValue: number;
	disabled: boolean;
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

	function setEditing(disabled: boolean) {
		if (!disabled) {
			editing = true;
		}
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
		const newValue = restrict(Number(value), min, max);
		if (value.trim().length && !Number.isNaN(newValue)) {
			if (newValue !== oldValue) {
				oldValue = newValue;
				onChange(newValue);
			}
		}

		value = String(oldValue);
	}

	return {
		view(vnode) {
			const { label, disabled, id } = vnode.attrs;

			if (editing) {
				return [
					m("label", { for: id }, label),
					m("input[type=text].number-input", {
						id,
						value,
						oncreate: ({ dom }) => {
							(dom as HTMLInputElement).focus();
							(dom as HTMLInputElement).select();
						},
						oninput: setValue,
						onkeypress: saveValueOnEnter,
						onblur: saveValue,
					}),
				];
			}

			return [
				m("span", label),
				disabled
					? m("span", value)
					: m("button", { onclick: () => setEditing(disabled) }, value),
			];
		},
	};
};
