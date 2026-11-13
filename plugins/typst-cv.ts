import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import type { Plugin } from "vite";

const run = promisify(execFile);

export interface TypstCvOptions {
	/** Typst source, relative to the project root. */
	source?: string;
	/** Compiled PDF, served as-is from public/. */
	pdf?: string;
}

/**
 * Compiles the typst CV to a PDF.
 * Runs once at startup (dev and build) and again whenever a .typ file changes.
 * If typst isn't installed (e.g. CI), it warns and keeps the committed outputs.
 */
export function typstCv(options: TypstCvOptions = {}): Plugin {
	const source = options.source ?? "cv/cv.typ";
	const pdf = options.pdf ?? "public/cv.pdf";
	let root = process.cwd();

	async function compile(
		log: (msg: string) => void,
		warn: (msg: string) => void,
	) {
		const src = resolve(root, source);
		const pdfOut = resolve(root, pdf);
		try {
			await mkdir(dirname(pdfOut), { recursive: true });
			await run("typst", ["compile", "--root", root, src, pdfOut]);
			log(`compiled ${source} -> ${pdf}`);
		} catch (err) {
			const e = err as NodeJS.ErrnoException & { stderr?: string };
			if (e.code === "ENOENT") {
				warn("typst not found; skipping CV compile and using the existing PDF");
			} else {
				// Surface typst's own diagnostics (line numbers etc.) without killing dev.
				warn(`CV compile failed:\n${e.stderr ?? e.message}`);
			}
		}
	}

	return {
		name: "typst-cv",
		configResolved: async (config) => {
			root = config.root;
			const logger = config.logger;
			// `vite build` re-evaluates the config per environment (fresh module
			// each time), so the once-per-process guard has to live on globalThis.
			const g = globalThis as { __typstCvInitial?: Promise<void> };
			g.__typstCvInitial ??= compile(
				(m) => logger.info(`[typst-cv] ${m}`),
				(m) => logger.warn(`[typst-cv] ${m}`),
			);
			await g.__typstCvInitial;
		},
		configureServer(server) {
			const dir = dirname(resolve(root, source));
			server.watcher.add(dir);
			let timer: NodeJS.Timeout | undefined;
			server.watcher.on("change", (file) => {
				if (!file.endsWith(".typ") || !file.startsWith(dir)) return;
				clearTimeout(timer);
				timer = setTimeout(() => {
					void compile(
						(m) => server.config.logger.info(`[typst-cv] ${m}`),
						(m) => server.config.logger.warn(`[typst-cv] ${m}`),
					);
				}, 100);
			});
		},
	};
}
