import { Link } from "@kobalte/core/link";
import { For } from "solid-js";
import FeaturedPhotos from "~/components/FeaturedPhotos";
import NewsletterSignup from "~/components/NewsletterSignup";
import PageTitle from "~/components/PageTitle";
import WorkCard from "~/components/WorkCard";
import { about } from "~/lib/about";
import { work } from "~/lib/work";

export default function Home() {
	return (
		<>
			<PageTitle
				seoTitle="Benjamin Lucier — Fullstack ML Engineer"
				description="Portfolio of Benjamin Lucier, fullstack ML engineer: about him, his CV and stack, and the products and open source he's made."
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
								<For each={about}>
									{(paragraph) => (
										<p>
											<For each={paragraph}>
												{(span) =>
													typeof span === "string" ? (
														span
													) : (
														<Link
															href={span.href}
															target="_blank"
															rel="noopener"
														>
															{span.text}
														</Link>
													)
												}
											</For>
										</p>
									)}
								</For>
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
