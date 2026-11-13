import { pageRoutes } from "virtual:file-routes";
import { createRouter, useLocation } from "@solidjs/router";
import { fileRoutes } from "@solidjs/router/fs";
import type { JSX } from "@solidjs/web";
import { onSettled, Show } from "solid-js";
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import "~/styles/app.css";

const Router = createRouter({ routes: fileRoutes(pageRoutes) });

export default function App() {
	// Enables colour transitions only after first paint + hydration.
	onSettled(() => {
		document.documentElement.dataset.ready = "";
	});

	return <Router>{(props) => <Shell>{props.children}</Shell>}</Router>;
}

/** Pages that take the whole viewport, without the header, footer or page column. */
const FULL_SCREEN = new Set(["/pathfinding"]);

function Shell(props: { children?: JSX.Element }) {
	const location = useLocation();
	const fullScreen = () =>
		FULL_SCREEN.has(location.pathname.replace(/(.)\/$/, "$1"));

	return (
		<Show when={!fullScreen()} fallback={<main>{props.children}</main>}>
			<div class="page-shell mx-auto flex min-h-dvh max-w-[calc(var(--container-page)+100vw-100%)] flex-col">
				<Header />
				{/* A flex column so a page can centre itself vertically with my-auto. */}
				<main class="flex flex-1 flex-col pt-5 pb-10 sm:pt-7 sm:pb-14">
					{props.children}
				</main>
				<Footer />
			</div>
		</Show>
	);
}
