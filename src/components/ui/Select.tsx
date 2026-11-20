import { Select as KSelect } from "@kobalte/core/select";
import { Check, ChevronDown } from "@lucide/solid";

export type SelectOption<T extends string> = { value: T; label: string };

export default function Select<T extends string>(props: {
	value: T;
	options: readonly SelectOption<T>[];
	onChange: (value: T) => void;
	/** Accessible name; there is no visible label. */
	label: string;
	disabled?: boolean;
}) {
	const selected = () =>
		props.options.find((o) => o.value === props.value) ?? null;
	return (
		<KSelect<SelectOption<T>>
			options={[...props.options]}
			optionValue="value"
			optionTextValue="label"
			value={selected()}
			// Kobalte reports null when the selection is cleared; this select always has a value.
			onChange={(option) => option && props.onChange(option.value)}
			disabled={props.disabled ?? false}
			disallowEmptySelection
			itemComponent={(item) => (
				<KSelect.Item
					item={item.item}
					class="flex h-11 cursor-pointer items-center justify-between gap-3 rounded px-3 font-sans text-base text-ink outline-none data-highlighted:bg-wash"
				>
					<KSelect.ItemLabel>{item.item.rawValue.label}</KSelect.ItemLabel>
					<KSelect.ItemIndicator>
						<Check size={16} aria-hidden="true" />
					</KSelect.ItemIndicator>
				</KSelect.Item>
			)}
		>
			<KSelect.HiddenSelect />
			{/* Same h-11 as Button, so they line up in a row without any alignment tricks. */}
			<KSelect.Trigger
				aria-label={props.label}
				class="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-rule-strong bg-paper pr-3 pl-3 font-sans text-base font-medium text-ink shadow-sm transition-colors hover:enabled:bg-wash disabled:cursor-not-allowed disabled:opacity-45"
			>
				<KSelect.Value<SelectOption<T>>>
					{(state) => state.selectedOption().label}
				</KSelect.Value>
				<KSelect.Icon class="text-muted">
					<ChevronDown size={16} aria-hidden="true" />
				</KSelect.Icon>
			</KSelect.Trigger>
			<KSelect.Portal>
				<KSelect.Content class="z-50 rounded-md border border-rule-strong bg-paper p-1 shadow-md">
					<KSelect.Listbox class="outline-none" />
				</KSelect.Content>
			</KSelect.Portal>
		</KSelect>
	);
}
