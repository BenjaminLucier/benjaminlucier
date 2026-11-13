import type { IconNode } from "lucide";

const toMarkup = (node: IconNode) =>
	node
		.map(([tag, attrs]) => {
			const a = Object.entries(attrs)
				.map(([k, v]) => `${k}="${v}"`)
				.join(" ");
			return `<${tag} ${a}/>`;
		})
		.join("");

/** Renders a lucide icon node as inline SVG (works in static HTML). */
export default function Icon(props: { icon: IconNode; size?: number }) {
	const size = () => props.size ?? 18;
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size()}
			height={size()}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			innerHTML={toMarkup(props.icon)}
		/>
	);
}
