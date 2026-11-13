import { For } from "solid-js";

export type SelectOption<T extends string> = { value: T; label: string };

export default function Select<T extends string>(props: {
	value: T;
	options: readonly SelectOption<T>[];
	onChange: (value: T) => void;
	/** Accessible name; there is no visible label. */
	label: string;
	disabled?: boolean;
}) {
	return (
		<span class="relative inline-flex">
			<select
				// Same h-11 as Button, so they line up in a row without any alignment tricks.
				// text-base (16px) keeps iOS Safari from zooming the page when it gains focus.
				class="h-11 cursor-pointer appearance-none rounded-md border border-rule-strong bg-paper pr-9 pl-3 font-sans text-base font-medium text-ink shadow-sm transition-colors hover:enabled:bg-wash disabled:cursor-not-allowed disabled:opacity-45"
				aria-label={props.label}
				disabled={props.disabled}
				value={props.value}
				onChange={(e) => props.onChange(e.currentTarget.value as T)}
			>
				<For each={props.options}>
					{(o) => <option value={o.value}>{o.label}</option>}
				</For>
			</select>
			<svg
				class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="m6 9 6 6 6-6" />
			</svg>
		</span>
	);
}
