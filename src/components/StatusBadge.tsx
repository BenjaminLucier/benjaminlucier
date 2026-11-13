import type { Work } from "~/lib/work";

/** Classes per tone, spelled out in full so Tailwind finds them. */
const tones = {
	yellow: {
		pill: "border-ctp-yellow/50 bg-ctp-yellow/10",
		dot: "bg-ctp-yellow",
	},
	green: {
		pill: "border-ctp-green/50 bg-ctp-green/10",
		dot: "bg-ctp-green",
	},
	blue: {
		pill: "border-ctp-blue/50 bg-ctp-blue/10",
		dot: "bg-ctp-blue",
	},
} as const;

/**
 * A short label on a work entry: its status ("Alpha" in yellow, the default; "Live" in
 * green) or that it is open source (blue). A noticeable but casual disclosure: a soft
 * pill with a faint Catppuccin tint and outline, and a dot in the same colour.
 */
export default function StatusBadge(props: {
	status: string;
	tone?: keyof typeof tones;
}) {
	const tone = () => tones[props.tone ?? "yellow"];
	return (
		<span
			class={`inline-flex items-center gap-1.5 rounded-full border px-2 py-px font-sans text-xs font-medium leading-5 text-ink ${tone().pill}`}
		>
			<span
				class={`inline-block size-1.5 rounded-full ${tone().dot}`}
				aria-hidden="true"
			/>
			{props.status}
		</span>
	);
}

/** Every badge a work entry carries: its status, then whether it is open source. */
export function WorkBadges(props: {
	work: Pick<Work, "status" | "openSource">;
}) {
	return (
		<>
			{props.work.status ? (
				<StatusBadge
					status={props.work.status}
					tone={props.work.status === "Live" ? "green" : "yellow"}
				/>
			) : null}
			{props.work.openSource ? (
				<StatusBadge status="Open Source" tone="blue" />
			) : null}
		</>
	);
}
