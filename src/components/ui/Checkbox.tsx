import { Checkbox as KCheckbox } from "@kobalte/core/checkbox";
import { Check } from "@lucide/solid";
import type { JSX } from "@solidjs/web";
import { omit } from "solid-js";

export default function Checkbox(props: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	name?: string;
	required?: boolean;
	children: JSX.Element;
}) {
	return (
		<KCheckbox
			{...omit(props, "children")}
			class="group flex min-h-11 cursor-pointer items-center gap-2 font-sans text-base text-ink data-disabled:cursor-not-allowed data-disabled:opacity-45"
		>
			<KCheckbox.Input class="peer" />
			<KCheckbox.Control class="flex size-5 items-center justify-center rounded border border-rule-strong bg-paper text-paper transition-colors group-data-checked:border-link group-data-checked:bg-link peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-link">
				<KCheckbox.Indicator>
					<Check size={14} stroke-width={3} aria-hidden="true" />
				</KCheckbox.Indicator>
			</KCheckbox.Control>
			<KCheckbox.Label class="cursor-[inherit]">
				{props.children}
			</KCheckbox.Label>
		</KCheckbox>
	);
}
