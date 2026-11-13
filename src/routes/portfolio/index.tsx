import { For } from "solid-js";
import PageTitle from "~/components/PageTitle";
import WorkCard from "~/components/WorkCard";
import { work } from "~/lib/work";

export default function Portfolio() {
	return (
		<>
			<PageTitle
				seoTitle="Portfolio — Benjamin Lucier: Incredible, Travel.Nexus & More"
				description="Portfolio of Benjamin Lucier: Incredible, a personal everything app, Travel.Nexus, a trip planner, and open-source Rust code."
			/>
			<h1 class="mb-8 font-sans text-4xl font-bold tracking-tight text-ink">
				Portfolio
			</h1>
			<div class="grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
				<For each={work}>{(w) => <WorkCard work={w} />}</For>
			</div>
		</>
	);
}
