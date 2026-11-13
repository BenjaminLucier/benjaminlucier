import { For } from "solid-js";
import FeaturedPhotos from "~/components/FeaturedPhotos";
import NewsletterSignup from "~/components/NewsletterSignup";
import PageTitle from "~/components/PageTitle";
import WorkCard from "~/components/WorkCard";
import { work } from "~/lib/work";

export default function Home() {
	return (
		<>
			<PageTitle
				seoTitle="Benjamin Lucier — Fullstack Engineer Building AI Products"
				description="Fullstack engineer and founder building agentic, AI-native products: about me, what I'm looking for, and what I've built."
			/>
			{/* About and Featured are centred in the space above the newsletter. */}
			{/* pt: breathing room below the header even when there is no spare height to centre in. */}
			<div class="my-auto flex flex-col gap-12 pt-2 sm:pt-4">
				<section aria-labelledby="about">
					{/* Not shown: the nav already marks this page as About. Kept for screen
					    readers and search engines, as the page's main heading. */}
					<h1 id="about" class="sr-only">
						About Benjamin Lucier
					</h1>
					<p class="mb-6 flex items-start gap-2.5 font-sans text-sm text-muted">
						{/* A live-status pulse: a ring that grows and fades behind the dot.
						    Skipped for people who ask their system for reduced motion. */}
						<span
							class="relative mt-1.5 inline-flex size-2 shrink-0"
							aria-hidden="true"
						>
							<span class="absolute inline-flex size-full rounded-full bg-ctp-green opacity-75 motion-safe:animate-ping" />
							<span class="relative inline-flex size-2 rounded-full bg-ctp-green" />
						</span>
						<span>
							<span class="font-semibold text-ink">Open to work</span>
							{
								" · Staff / Senior Fullstack SWE · Agentic / ML Applications · Fulltime, Remote, Americas"
							}
						</span>
					</p>
					{/* The photo floats, so the bio wraps around and then under it. Its top
					    lines up with the first line of text, not the line box above it. */}
					<div class="flow-root">
						<FeaturedPhotos class="mt-1.5 mr-7 mb-3 hidden md:float-left md:block" />
						<div>
							<div class="prose text-pretty">
								<p>
									I'm a founder and fullstack ML engineer who loves taking
									products from zero to one. I architect and build entire
									applications end to end, from the database and backend to the
									frontend, cloud infrastructure and CI/CD. I do most of my work
									using Rust, Python, TypeScript and SQL.
								</p>
								<p>
									Lately that means building agentic functionality into products
									and putting machine learning into production, like
									recommendation systems that lifted engagement by up to 36%
									over baseline. Before that, I owned the core API and billing
									infrastructure behind more than $10M ARR, and helped scale the
									engineering team 5x.
								</p>
								<p>
									I love an adventure: I've travelled to ~30 countries,
									circumnavigated Vancouver Island on a sailboat, ridden my
									motorcycle from coast to coast, splitboarded up and down
									mountains in the Rockies, Alps and BC Coastal Ranges. When I
									am not writing code or planning my next adventure, I like to
									play chess and read.
								</p>
							</div>
						</div>
					</div>
				</section>

				<section aria-labelledby="featured">
					<h2
						id="featured"
						class="meta mb-6 font-semibold uppercase tracking-widest"
					>
						Featured
					</h2>
					<div class="grid gap-x-10 gap-y-10 md:grid-cols-3">
						<For each={work.filter((w) => w.featured)}>
							{(w) => <WorkCard work={w} />}
						</For>
					</div>
				</section>
			</div>

			{/* Always at the bottom of the page. */}
			<NewsletterSignup class="mt-12" />
		</>
	);
}
