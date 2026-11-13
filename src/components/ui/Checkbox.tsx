import type { JSX } from "@solidjs/web";

export default function Checkbox(props: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	name?: string;
	required?: boolean;
	children: JSX.Element;
}) {
	return (
		<label
			class={`flex min-h-11 items-center gap-2 font-sans text-base text-ink ${props.disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
		>
			<input
				type="checkbox"
				class="size-5 cursor-[inherit] accent-link"
				checked={props.checked}
				disabled={props.disabled}
				name={props.name}
				required={props.required}
				onChange={(e) => props.onChange(e.currentTarget.checked)}
			/>
			{props.children}
		</label>
	);
}
