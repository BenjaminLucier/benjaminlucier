import { chromium } from "playwright";
import { serveDist } from "./lib/crawl.mjs";

const server = await serveDist();

const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 375, height: 812 },
	hasTouch: true,
	isMobile: true,
});
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
	if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

const failures = [];
const check = (label, ok, detail) => {
	if (!ok) failures.push(`${label}: ${detail}`);
	else console.log(`ok  ${label}`);
};

// --- Pathfinding: touch-drag on a maze draws walls (the page is full screen, nothing scrolls) ---
await page.goto("http://localhost:4199/pathfinding", {
	waitUntil: "load",
});
const mazeCanvas = page.locator('canvas[data-view="grid"]').first();
await mazeCanvas.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
const box = await mazeCanvas.boundingBox();
const mazePixels = () =>
	page.evaluate(() => {
		const c = document.querySelector('canvas[data-view="grid"]');
		const ctx = c.getContext("2d");
		const d = ctx.getImageData(0, 0, c.width, c.height).data;
		let h = 0;
		for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0;
		return h;
	});
const pixelsBefore = await mazePixels();
// drag across the top-left area of the maze
const startX = box.x + box.width * 0.15;
const startY = box.y + box.height * 0.2;
// simulate a touch drag via CDP-backed dispatch
const client = await page.context().newCDPSession(page);
await client.send("Input.dispatchTouchEvent", {
	type: "touchStart",
	touchPoints: [{ x: startX, y: startY }],
});
for (let i = 1; i <= 6; i++) {
	await client.send("Input.dispatchTouchEvent", {
		type: "touchMove",
		touchPoints: [{ x: startX + i * 12, y: startY + i * 4 }],
	});
}
await client.send("Input.dispatchTouchEvent", {
	type: "touchEnd",
	touchPoints: [],
});
await page.waitForTimeout(300);
const pixelsAfter = await mazePixels();
check(
	"pathfinding touch-draw",
	pixelsAfter !== pixelsBefore,
	`pixel hash before=${pixelsBefore} after=${pixelsAfter}`,
);

check("no page errors", errors.length === 0, errors.slice(0, 5).join(" | "));

await browser.close();
server.close();
if (failures.length) {
	console.log(`FAIL (${failures.length})`);
	for (const f of failures) console.log(`  - ${f}`);
	process.exit(1);
}
console.log("INTERACTION CHECKS DONE");
