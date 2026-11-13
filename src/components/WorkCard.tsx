import Card from "~/components/Card";
import { WorkBadges } from "~/components/StatusBadge";
import type { Work } from "~/lib/work";

export default function WorkCard(props: { work: Work }) {
	return (
		<Card
			href={props.work.href}
			external={!props.work.href.startsWith("/")}
			image={{ kind: "work", slug: props.work.slug }}
			badge={
				props.work.status || props.work.openSource ? (
					<WorkBadges work={props.work} />
				) : undefined
			}
			title={props.work.title}
			summary={props.work.summary}
		/>
	);
}
