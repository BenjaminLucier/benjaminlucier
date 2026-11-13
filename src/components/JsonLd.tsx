import { Script } from "@solidjs/meta";
import type { Thing } from "schema-dts";

/** A JSON-LD payload: one entity, a list, or an `@graph` whose entries share `@id` refs. */
export type JsonLdData =
	| Thing
	| Thing[]
	| { "@context": string; "@graph": Thing[] };

/**
 * A schema.org JSON-LD block, hoisted into <head> by @solidjs/meta. Data is typed with
 * schema-dts. `<` is escaped so a stray sequence in the data can never close the tag.
 */
export default function JsonLd(props: { data: JsonLdData }) {
	return (
		<Script type="application/ld+json">
			{JSON.stringify(props.data).replace(/</g, "\\u003c")}
		</Script>
	);
}
