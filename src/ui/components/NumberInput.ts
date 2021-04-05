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
	const { onChange, defaultValue } = attrs;
	let oldValue = defaultValue;
	let value = String(defaultValue);
	let editing = false;
	let focusButton = false;

	function setEditing(disabled: boolean) {
		if (!disabled) {
			editing = true;
		}
	}

	function setValue(e: InputEvent) {
		const newValue = (e.target as HTMLInputElement).value;
		value = newValue;
	}

	function saveValueOnEnter(e: KeyboardEvent, min: number, max: number) {
		if (editing && e.key === "Enter") {
			editing = false;
			submitValue(min, max);
		}
	}

	function saveValue(min: number, max: number) {
		if (editing) {
			editing = false;
			submitValue(min, max);
		}
	}

	function submitValue(min: number, max: number) {
		const newValue = restrict(Number(value), min, max);
		if (value.trim().length && Number.isInteger(newValue)) {
			if (newValue !== oldValue) {
				oldValue = newValue;
				onChange(newValue);
			}
		}

		value = String(oldValue);
	}

	return {
		view(vnode) {
			const { label, disabled, id, min, max } = vnode.attrs;

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
						onkeypress: (e: KeyboardEvent) => saveValueOnEnter(e, min, max),
						onblur: () => {
							focusButton = true;
							saveValue(min, max);
						},
					}),
				];
			}

			return [
				m("span", label),
				disabled
					? m("span", value)
					: m(
							"button",
							{
								onclick: () => setEditing(disabled),
								oncreate(vnode) {
									if (focusButton) {
										(vnode.dom as HTMLButtonElement).focus();
										focusButton = false;
									}
								},
							},
							value,
					  ),
			];
		},
	};
};
