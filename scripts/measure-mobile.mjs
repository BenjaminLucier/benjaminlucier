import { chromium } from "playwright";
import { crawlRoutes, serveDist } from "./lib/crawl.mjs";

const server = await serveDist();
const ROUTES = await crawlRoutes();

const browser = await chromium.launch();
const failures = [];

function check(label, ok, detail) {
	if (!ok) failures.push(`${label}: ${detail}`);
}

// --- Mobile pass: 320 and 375, touch emulation ---
for (const width of [320, 375]) {
	const page = await browser.newPage({
		viewport: { width, height: 812 },
		hasTouch: true,
		isMobile: true,
		deviceScaleFactor: 2,
	});
	for (const route of ROUTES) {
		await page.goto(`http://localhost:4199${route}`, { waitUntil: "load" });
		const label = `${width}px ${route}`;
		const overflow = await page.evaluate(() => {
			const doc = document.documentElement;
			const bad = [];
			if (doc.scrollWidth > window.innerWidth + 1) {
				// find the widest offenders
				for (const el of document.querySelectorAll("*")) {
					const r = el.getBoundingClientRect();
					if (r.right > window.innerWidth + 1 && r.width > 8)
						bad.push(
							`${el.tagName}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)}`,
						);
					if (bad.length > 4) break;
				}
			}
			return { overflow: doc.scrollWidth - window.innerWidth, bad };
		});
		check(
			label,
			overflow.overflow <= 0,
			`horizontal overflow ${overflow.overflow}px ${overflow.bad.join(" | ")}`,
		);

		// Theme toggle must not overlap any nav link
		const overlap = await page.evaluate(() => {
			// Full-screen pages (e.g. /pathfinding) have no site nav to collide with.
			if (!document.querySelector("nav")) return null;
			const toggle = document.querySelector(
				'nav button[aria-label*="theme" i], nav button[title*="theme" i]',
			);
			if (!toggle) return "toggle not found";
			const t = toggle.getBoundingClientRect();
			const links = [...document.querySelectorAll("nav ul a")];
			if (!links.length) return "no nav links";
			for (const a of links) {
				const r = a.getBoundingClientRect();
				const x = Math.max(
					0,
					Math.min(t.right, r.right) - Math.max(t.left, r.left),
				);
				const y = Math.max(
					0,
					Math.min(t.bottom, r.bottom) - Math.max(t.top, r.top),
				);
				if (x > 0 && y > 0)
					return `overlaps "${a.textContent}" by ${Math.round(x)}x${Math.round(y)}px`;
			}
			return null;
		});
		check(label, overlap === null, String(overlap));
	}

	// Tap-target audit on a few representative pages
	for (const route of ["/", "/portfolio", "/pathfinding"]) {
		await page.goto(`http://localhost:4199${route}`, { waitUntil: "load" });
		const label = `${width}px ${route}`;
		const sizes = await page.evaluate(() => {
			const out = [];
			const probe = (sel, name, minH, minW = 0) => {
				for (const el of document.querySelectorAll(sel)) {
					if (el.disabled) continue;
					// Hidden from everyone: not a tap target.
					if (el.closest("[aria-hidden=true]")) continue;
					const r = el.getBoundingClientRect();
					if (r.width === 0 && r.height === 0) continue;
					const small = r.height < minH || r.width < minW;
					if (small)
						out.push(
							`${name} "${(el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 24)}" ${Math.round(r.width)}x${Math.round(r.height)}`,
						);
				}
			};
			// Nav links are height-checked only: a short label like "CV" is fine when
			// the row is 44px tall and the links have gaps between them.
			probe("nav ul a", "nav-link", 40);
			probe("footer ul a", "social", 44, 44);
			probe('nav button[title*="theme" i]', "toggle", 44);
			probe("main button", "button", 44);
			probe("main select", "select", 44);
			probe("main fieldset button", "pill", 44);
			probe("main a.meta-link", "meta-link", 40);
			probe('main input:not([type="range"], [type="checkbox"])', "input", 44);
			return out;
		});
		check(label, sizes.length === 0, `small tap targets: ${sizes.join("; ")}`);

		const selectFont = await page.evaluate(() => {
			const s = document.querySelector("main select");
			return s ? Number.parseFloat(getComputedStyle(s).fontSize) : null;
		});
		if (selectFont !== null)
			check(
				label,
				selectFont >= 16,
				`select font ${selectFont}px (iOS zoom risk)`,
			);
	}

	// Pathfinding is full screen: the boards own every touch, and nothing scrolls.
	await page.goto("http://localhost:4199/pathfinding", { waitUntil: "load" });
	const touch = await page.evaluate(() => ({
		canvases: [
			...new Set(
				[...document.querySelectorAll("main canvas")].map(
					(el) => getComputedStyle(el).touchAction,
				),
			),
		],
		overflow: document.documentElement.scrollHeight - window.innerHeight,
	}));
	check(
		`${width}px pathfinding full screen`,
		touch.canvases.every((t) => t === "none") && touch.overflow <= 0,
		JSON.stringify(touch),
	);
	await page.close();
}

// --- Tablet pass: 768 ---
{
	const page = await browser.newPage({
		viewport: { width: 768, height: 1024 },
	});
	const colsAt = async (route, sel = "main .grid") => {
		await page.goto(`http://localhost:4199${route}`, { waitUntil: "load" });
		return page.evaluate((s) => {
			const g = document.querySelector(s);
			return g ? getComputedStyle(g).gridTemplateColumns.split(" ").length : 0;
		}, sel);
	};
	check(
		"768px /portfolio",
		(await colsAt("/portfolio")) === 2,
		`expected 2 columns`,
	);
	await page.close();
}

// --- Desktop sanity: 1280 ---
{
	const page = await browser.newPage({
		viewport: { width: 1280, height: 800 },
	});
	await page.goto("http://localhost:4199/", { waitUntil: "load" });
	const nav = await page.evaluate(() => {
		// The name (with its tagline) is the bar's only home link that isn't a nav item.
		const name = document.querySelector('nav a[href="/"]:not(.nav-link)');
		const toggle = document.querySelector('nav button[title*="theme" i]');
		const ul = document.querySelector("nav ul");
		return {
			nameVisible: name && getComputedStyle(name).display !== "none",
			namePos: name ? getComputedStyle(name.parentElement).position : null,
			togglePos: toggle
				? getComputedStyle(toggle.parentElement).position
				: "n/a",
			ulCentered: ul ? getComputedStyle(ul).justifyContent : null,
		};
	});
	check(
		"1280px nav",
		nav.nameVisible &&
			nav.namePos === "absolute" &&
			nav.togglePos === "absolute",
		JSON.stringify(nav),
	);

	const colsAt = async (route) => {
		await page.goto(`http://localhost:4199${route}`, { waitUntil: "load" });
		return page.evaluate(() => {
			const g = document.querySelector("main .grid");
			return g ? getComputedStyle(g).gridTemplateColumns.split(" ").length : 0;
		});
	};
	check(
		"1280px /portfolio",
		(await colsAt("/portfolio")) === 3,
		`expected 3 columns`,
	);

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	check("1280px /", overflow <= 0, `overflow ${overflow}px`);
	await page.close();
}

await browser.close();
server.close();

if (failures.length) {
	console.log(`FAIL (${failures.length})`);
	for (const f of failures) console.log(`  - ${f}`);
	process.exit(1);
} else {
	console.log("ALL CHECKS PASSED");
}
