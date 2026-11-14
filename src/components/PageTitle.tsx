import { Link, Meta, Title } from "@solidjs/meta";
import { useLocation } from "@solidjs/router";
import type { Person, Thing, WebSite } from "schema-dts";
import JsonLd from "~/components/JsonLd";
import { site, social } from "~/lib/site";
import { IMAGE_HEIGHT, IMAGE_WIDTH, ogSrc, SITE_IMAGE } from "~/lib/thumbnails";

/** Every page shares the portfolio's social preview image. */
const IMAGE = ogSrc(SITE_IMAGE.kind, SITE_IMAGE.slug);

// --- schema.org structured data (JSON-LD), connected by @id across pages ---

const personId = `${site.url}/#person`;

const person: Person = {
	"@type": "Person",
	"@id": personId,
	name: site.name,
	url: site.url,
	image: `${site.url}/FeaturedImage1.webp`,
	description: "Fullstack ML engineer who builds products end to end.",
	jobTitle: "Fullstack ML Engineer",
	sameAs: social.map((s) => s.href),
};

const website: WebSite = {
	"@type": "WebSite",
	"@id": `${site.url}/#website`,
	url: site.url,
	name: site.name,
	publisher: { "@id": personId },
	inLanguage: "en",
};

/** Sets <title>, description, canonical link and the Open Graph / Twitter tags for a page. */
export default function PageTitle(props: {
	title?: string;
	/** Full <title>/og:title override, used verbatim — the caller includes the brand
	 * when needed to hit the ~50-60 character SERP sweet spot. */
	seoTitle?: string | undefined;
	description?: string;
}) {
	const location = useLocation();
	const path = () => location.pathname.replace(/(.)\/$/, "$1");
	const title = () =>
		props.seoTitle ??
		(props.title ? `${props.title} — ${site.name}` : site.name);
	const description = () => props.description ?? site.seoDescription;
	const url = () => `${site.url}${path() === "/" ? "" : path()}`;
	const image = `${site.url}${IMAGE}`;

	/** Every page gets the person + website graph, connected by @id. */
	const jsonLd = {
		"@context": "https://schema.org",
		"@graph": [person, website] satisfies Thing[],
	};

	return (
		<>
			<Title>{title()}</Title>
			<Meta name="description" content={description()} />
			<Link rel="canonical" href={url()} />

			<Meta property="og:site_name" content={site.name} />
			<Meta property="og:type" content="website" />
			<Meta property="og:title" content={title()} />
			<Meta property="og:description" content={description()} />
			<Meta property="og:url" content={url()} />
			<Meta property="og:image" content={image} />
			<Meta property="og:image:width" content={String(IMAGE_WIDTH)} />
			<Meta property="og:image:height" content={String(IMAGE_HEIGHT)} />
			<Meta property="og:image:alt" content={props.title ?? site.name} />

			<Meta name="twitter:card" content="summary_large_image" />
			<Meta name="twitter:title" content={title()} />
			<Meta name="twitter:description" content={description()} />
			<Meta name="twitter:image" content={image} />

			<JsonLd data={jsonLd} />
		</>
	);
}
