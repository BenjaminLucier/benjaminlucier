import { type ButtonRootProps, Button as KButton } from "@kobalte/core/button";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import { omit } from "solid-js";

const base =
	"inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 font-sans text-base font-medium shadow-sm transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45";

const variants = {
	default: "border-rule-strong bg-paper text-ink hover:enabled:bg-wash",
	primary: "border-ink bg-ink text-paper hover:enabled:opacity-85",
};

export default function Button(
	props: PolymorphicProps<"button", ButtonRootProps<"button">> & {
		variant?: keyof typeof variants;
	},
) {
	const rest = omit(props, "class", "type", "variant");
	return (
		<KButton
			type={props.type ?? "button"}
			class={`${base} ${variants[props.variant ?? "default"]} ${props.class ?? ""}`}
			{...rest}
		/>
	);
}
