import { Link } from "@kobalte/core/link";
import { For, Show } from "solid-js";
import PageTitle from "~/components/PageTitle";

interface Entry {
	title: string;
	org: string;
	href: string;
	dates: string;
	place: string;
	bullets?: string[];
}

const education: Entry[] = [
	{
		title: "Machine Learning Specialization",
		org: "Stanford University",
		href: "https://www.stanford.edu",
		dates: "2024",
		place: "Online",
	},
	{
		title: "Computer Science, Incomplete",
		org: "McMaster University",
		href: "https://www.mcmaster.ca",
		dates: "2016–2019",
		place: "Hamilton, Ontario, Canada",
	},
	{
		title: "Professional Education",
		org: "DeepLearning.AI",
		href: "https://www.deeplearning.ai",
		dates: "2024 – Present",
		place: "Online",
		bullets: [
			"Machine Learning in Production (2024)",
			"Fast & Efficient LLM Inference with vLLM (2026)",
			"Building AI Applications with Haystack (2025)",
			"DSPy: Build and Optimize Agentic Apps (2025)",
			"Transformers in Practice (2026)",
			"How Transformer LLMs Work (2026)",
		],
	},
];

const experience: Entry[] = [
	{
		title: "Lead AI Application Engineer",
		org: "Codex.Lawyer",
		href: "https://codex.lawyer",
		dates: "Nov 2025 — Apr 2026",
		place: "Remote",
		bullets: [
			"Engaged as head engineer to build an AI-native legal web app, collaborating directly with stakeholders.",
			"Built an agentic legal assistant using LangGraph & pgvector, agentic RAG with ReAct tool-calling.",
			"Architected 0→1 cloud infrastructure: multi-tenant AWS infra (3-tier VPC, ECS, RDS, IAM) via Terraform IaC, GHA CI/CD automated testing & deploys, serving a FastAPI backend and SolidJS frontend.",
		],
	},
	{
		title: "Senior Software Engineer, Machine Learning",
		org: "The Suite",
		href: "https://thesuite.com",
		dates: "May 2024 — Aug 2025",
		place: "Remote",
		bullets: [
			"Pitched, built, and deployed an end-to-end ML recommendation pipeline (XGBoost, Scikit-Learn, MLflow, SageMaker) processing 10m+ annual analytics events.",
			"Increased email CTR by 22%, feed engagement by 17%, and peer connections by 36% compared to heuristic baselines, before interviewing, hiring and managing a turnkey handoff to permanent engineering owners.",
		],
	},
	{
		title: "Senior Software Engineer",
		org: "The Suite",
		href: "https://thesuite.com",
		dates: "May 2022 — May 2024",
		place: "Remote",
		bullets: [
			"Promoted twice in two years (Junior → SWE → Senior) for core infrastructure ownership and technical leadership.",
			"Managed core GraphQL/REST API services and Chargebee billing infrastructure supporting >$10m ARR.",
			"Led sensitive user permission system overhaul, engineering excellence initiative, billing migrations and codebase refactors, pushing 1000s of annual git commits and reviews (pre coding agents).",
			"Interviewed and evaluated candidates, helping scale the engineering team 5x.",
		],
	},
	{
		title: "Software Engineering Intern",
		org: "Modd.io",
		href: "https://modd.io",
		dates: "Mar 2022 — Apr 2022",
		place: "Remote",
		bullets: [
			"Worked on a social browser gaming engine and platform, then left after a month for a full-time role at The Suite.",
		],
	},
];

// public/cv.pdf is generated from cv/cv.typ by plugins/typst-cv.ts; this page is hand-written.
export default function CV() {
	return (
		<article class="mx-auto max-w-[48rem]">
			<PageTitle
				seoTitle="Benjamin Lucier's CV — Fullstack ML Engineer"
				description="CV of Benjamin Lucier, fullstack ML engineer: work experience in applied ML and core infrastructure, education and projects."
			/>
			<div class="mb-10 flex items-baseline justify-between gap-4">
				<h1 class="font-sans text-4xl font-bold tracking-tight text-ink">
					Curriculum Vitae
				</h1>
				<Link
					href="/cv.pdf"
					target="_blank"
					rel="noopener"
					class="meta-link whitespace-nowrap"
				>
					Open PDF ↗
				</Link>
			</div>

			<Section title="Work Experience" entries={experience} />
			<Section title="Education" entries={education} />
		</article>
	);
}

function Section(props: { title: string; entries: Entry[] }) {
	return (
		<section class="mb-12" aria-labelledby={props.title}>
			<h2
				id={props.title}
				class="meta mb-2 border-b border-rule-strong pb-2 font-bold uppercase tracking-widest"
			>
				{props.title}
			</h2>
			<For each={props.entries}>{(e) => <EntryRow entry={e} />}</For>
		</section>
	);
}

function EntryRow(props: { entry: Entry }) {
	return (
		<div class="grid gap-x-8 gap-y-2 border-b border-rule py-6 last:border-b-0 sm:grid-cols-[11rem_1fr]">
			<div class="meta sm:pt-1.5">
				<p class="tabular-nums">{props.entry.dates}</p>
				<p class="mt-0.5">{props.entry.place}</p>
			</div>
			<div>
				<h3 class="text-xl font-bold leading-snug text-ink">
					{props.entry.title}
				</h3>
				<p class="text-base">
					<Link href={props.entry.href} target="_blank" rel="noopener">
						{props.entry.org}
					</Link>
				</p>
				<Show when={props.entry.bullets}>
					{(bullets) => (
						<ul class="mt-3 list-disc space-y-1.5 pl-5 text-base marker:text-faint">
							<For each={bullets()}>{(b) => <li>{b}</li>}</For>
						</ul>
					)}
				</Show>
			</div>
		</div>
	);
}
