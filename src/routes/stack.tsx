import { For, Show } from "solid-js";
import PageTitle from "~/components/PageTitle";

type Item = string | { name: string; children: string[] };
type Group = { label?: string; items: Item[] };
type Category = { title: string; groups: Group[] };

const categories: Category[] = [
	{
		title: "Languages",
		groups: [
			{
				items: [
					"Python (FastAPI, Django)",
					"TypeScript, JavaScript",
					"Rust (Axum, Tokio, SQLx)",
					"SQL, GraphQL",
				],
			},
		],
	},
	{
		title: "Frameworks",
		groups: [
			{
				items: [
					"React, NextJS",
					"SolidJS",
					"TanStack (Query, Start)",
					"TailwindCSS",
					"Tauri",
					"WebGPU",
				],
			},
		],
	},
	{
		title: "Databases & Data",
		groups: [
			{
				items: ["PostgreSQL (PostGIS, pgvector)", "Redis"],
			},
		],
	},
	{
		title: "Modern CLI",
		groups: [
			{ items: ["ripgrep, fd, eza, bat", "jq, yq, fzf, zoxide, yazi", "Stow"] },
		],
	},
	{
		title: "ML & AI",
		groups: [
			{
				label: "Machine Learning",
				items: [
					"Numpy, Pandas",
					"Matplotlib, Seaborn",
					"SciKit-Learn, XGBoost",
					"SHAP, imbalanced-learn",
					"PyTorch",
					"MLflow",
				],
			},
			{
				label: "Agentic Applications",
				items: [
					"LangChain, LangGraph, LangFuse",
					"Rig, Pydantic AI",
					"OpenRouter, OpenAI, Claude",
				],
			},
		],
	},
	{
		title: "Cloud & Hosting",
		groups: [
			{
				label: "AWS",
				items: [
					"EC2, S3",
					"ECS, EKS, ECR",
					"RDS",
					"VPC, Route53, IAM",
					"SageMaker",
				],
			},
			{
				label: "Platforms",
				items: ["Fly.io", "Cloudflare (Workers, R2)", "Neon"],
			},
		],
	},
	{
		title: "Infrastructure & DevOps",
		groups: [
			{
				label: "Containers",
				items: ["Docker, Kubernetes"],
			},
			{
				label: "IaC & CI/CD",
				items: ["Terraform, GitHub Actions"],
			},
			{ label: "Secrets", items: ["Doppler, Infisical, envchain"] },
			{ label: "Payments", items: ["Stripe, Chargebee"] },
		],
	},
	{
		title: "Tooling & Environment",
		groups: [
			{
				items: [
					"uv, ruff, ty",
					"Vite, Biome",
					"Cargo, sqlx",
					"Node.js (fnm), pnpm",
					"Just, Git, gh",
					"Zed, Helix, Claude Code",
					"OpenSuperWhisper",
					"macOS, Homebrew",
					"zsh, Ghostty",
				],
			},
		],
	},
];

export default function Stack() {
	return (
		<article class="mx-auto max-w-[48rem]">
			<PageTitle
				seoTitle="Tech Stack: Languages, Frameworks & Tools — Benjamin Lucier"
				description="The technologies Benjamin Lucier reaches for: TypeScript, SolidJS, Rust, Python, Cloudflare Workers, Postgres, annotated."
			/>
			<h1 class="mb-6 font-sans text-4xl font-bold tracking-tight text-ink">
				Stack
			</h1>
			<div class="grid gap-x-10 gap-y-10 sm:grid-cols-2">
				<For each={categories}>
					{(category) => (
						<section>
							<h2 class="mb-2 border-b border-rule-strong pb-2 font-sans text-xl font-bold tracking-tight text-ink">
								{category.title}
							</h2>
							<For each={category.groups}>
								{(group) => (
									<div class="mt-4">
										<Show when={group.label}>
											<h3 class="meta mb-2 font-semibold uppercase tracking-widest">
												{group.label}
											</h3>
										</Show>
										<ul class="list-disc space-y-1.5 pl-5 text-base marker:text-faint">
											<For each={group.items}>
												{(item) =>
													typeof item === "string" ? (
														<li>{item}</li>
													) : (
														<li>
															{item.name}
															<ul class="mt-1.5 list-[circle] space-y-1.5 pl-5 marker:text-faint">
																<For each={item.children}>
																	{(child) => <li>{child}</li>}
																</For>
															</ul>
														</li>
													)
												}
											</For>
										</ul>
									</div>
								)}
							</For>
						</section>
					)}
				</For>
			</div>
		</article>
	);
}
