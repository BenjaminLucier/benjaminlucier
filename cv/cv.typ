// Compiled to public/cv.pdf by plugins/typst-cv.ts on `vite` / `vite build` and on save.

// ---------- helpers ----------

// Sections and entries also emit `metadata(...) <cv>` so scripts/linkedin.ts can
// read them with `typst query`; the PDF itself doesn't show it.
#let section(title, body) = {
  [#metadata((kind: "section", title: title)) <cv>]
  block(above: 1.2em, below: 0.3em, sticky: true)[
    #text(size: 12.5pt, weight: "bold")[#smallcaps(title)]
    #v(0.1em, weak: false)
    #line(length: 100%, stroke: 0.6pt)
  ]
  body
}

// row 1: title + right-aligned aside; row 2: italic sub + right-aligned aside; then bullets
// `linkedin` only affects cv/linkedin.md, not the PDF: `false` leaves the entry out,
// and a dictionary lists it under LinkedIn Experience instead, as
// (title: ..., start: ..., end: ...), with the entry's title as the company.
#let entry(title, aside, sub, aside2, linkedin: true, ..bullets) = block(breakable: false, above: 0.95em, below: 0em)[
  #metadata((kind: "entry", title: title, aside: aside, sub: sub, aside2: aside2, bullets: bullets.pos(), linkedin: linkedin)) <cv>
  #grid(
    columns: (1fr, auto),
    strong(title), aside,
  )
  #if sub != "" {
    grid(
      columns: (1fr, auto),
      emph(sub), emph(aside2),
    )
  }
  #if bullets.pos().len() > 0 { list(..bullets.pos()) }
]

// A LinkedIn career break: metadata only, so it goes to cv/linkedin.md but not the PDF.
#let career-break(type, start, end, ..highlights) = [
  #metadata((kind: "career-break", type: type, start: start, end: end, highlights: highlights.pos())) <cv>
]

// ---------- document ----------

#set document(title: "Benjamin Lucier — CV", author: "Benjamin Lucier", date: none)
#set page(width: 8.5in, height: auto, margin: (x: 0.4in, y: 0.4in))
#set text(font: "New Computer Modern", size: 10.5pt, lang: "en")
#set par(justify: false, leading: 0.5em, spacing: 0.4em)
#set block(spacing: 0.4em)
#set list(indent: 0.4em, body-indent: 0.5em, spacing: 0.45em, tight: true, marker: [•])
#show link: underline

#{
  let contacts = (
    link("mailto:benjaminlucier@gmail.com")[benjaminlucier\@gmail.com],
    link("https://github.com/benjaminlucier")[github.com/benjaminlucier],
    link("https://linkedin.com/in/benjaminlucier")[linkedin.com/in/benjaminlucier],
    link("https://benjaminlucier.com")[benjaminlucier.com],
  )
  let lead = ("+1 365 833 5858", "Ancaster, Ontario, Canada")
  text(size: 24pt, weight: "bold")[Benjamin Lucier]
  v(-0.25em)
  [#lead.join[ | ] \ #contacts.join[ | ]]
}

#section("Education")[
  #entry("Stanford University", "Online", "Machine Learning Specialization", "2024")
  #entry("McMaster University", "Hamilton, Ontario, Canada", "Computer Science, Incomplete", "2016–2019")
  #entry(
    "DeepLearning.AI",
    "Online",
    "Professional Education",
    "2024 – Present",
    [Machine Learning in Production (2024) | Fast & Efficient LLM Inference with vLLM (2026)],
    [Building AI Applications with Haystack (2025) | DSPy: Build and Optimize Agentic Apps (2025)],
    [Transformers in Practice (2026) | How Transformer LLMs Work (2026)],
  )
]

#section("Work Experience")[
  #career-break(
    "Travel",
    "Aug 2025",
    "Oct 2026",
    [Travelled through Central America and climbed several volcanoes.],
    [Learned to ride a motorcycle, then rode it across North America a few days after buying it.],
  )
  #entry(
    "Lead AI Application Engineer",
    "Nov 2025 — Apr 2026",
    "Codex.Lawyer",
    "Remote",
    [Engaged as head engineer to build an AI-native legal web app, collaborating directly with stakeholders.],
    [Built an agentic legal assistant using LangGraph & pgvector, agentic RAG with ReAct tool-calling.],
    [Architected 0→1 cloud infrastructure: multi-tenant AWS infra (3-tier VPC, ECS, RDS, IAM) via Terraform IaC, GHA CI/CD automated testing & deploys, serving a FastAPI backend and SolidJS frontend.],
    // A contract project that has since shut down; on the CV, but not on LinkedIn.
    linkedin: false,
  )
  #entry(
    "Senior Software Engineer, Machine Learning",
    "May 2024 — Aug 2025",
    "The Suite",
    "Remote",
    [Pitched, built, and deployed an end-to-end ML recommendation pipeline (XGBoost, Scikit-Learn, MLflow, SageMaker) processing 10m+ annual analytics events.],
    [Increased email CTR by 22%, feed engagement by 17%, and peer connections by 36% compared to heuristic baselines, before interviewing, hiring and managing a turnkey handoff to permanent engineering owners.],
  )
  #entry(
    "Senior Software Engineer",
    "May 2022 — May 2024",
    "The Suite",
    "Remote",
    [Promoted twice in two years (Junior → SWE → Senior) for core infrastructure ownership and technical leadership.],
    [Managed core GraphQL/REST API services and Chargebee billing infrastructure supporting >\$10m ARR.],
    [Led sensitive user permission system overhaul, engineering excellence initiative, billing migrations and codebase refactors, pushing 1000s of annual git commits and reviews (pre coding agents).],
    [Interviewed and evaluated candidates, helping scale the engineering team 5x.],
  )
  #entry(
    "Software Engineering Intern",
    "Mar 2022 — Apr 2022",
    "Modd.io",
    "Remote",
    [Worked on a social browser gaming engine and platform, then left after a month for a full-time role at The Suite.],
  )
]

#section("Open Source")[
  #entry(
    "Sophistry",
    link("https://sophistry.dev")[sophistry.dev],
    "Author & Maintainer",
    "",
    [Open-source, Manim-inspired library for controllable maths animations and charts on the web.],
    [Pure TypeScript Canvas2D core with code-generated SolidJS and React bindings, LaTeX and 3D.],
  )
  #entry(
    "cf-rs",
    link("https://github.com/BenjaminLucier/cf-rs")[github.com/BenjaminLucier/cf-rs],
    "Author & Maintainer",
    "",
    [Published `cf-images`, an async Rust client for Cloudflare Images, on #link("https://crates.io/crates/cf-images")[crates.io] with CI and automated releases.],
    [Published `cf-stream`, an async Rust client for Cloudflare Stream, on #link("https://crates.io/crates/cf-stream")[crates.io] with CI and automated releases.],
  )
  #entry(
    "anzan",
    link("https://github.com/BenjaminLucier/anzan")[github.com/BenjaminLucier/anzan],
    "Author & Maintainer",
    "",
    [Rust TUI for mental math practice with adaptive drills, published on #link("https://crates.io/crates/anzan")[crates.io] and Homebrew.],
  )
  #entry(
    "Gauntlet",
    link("https://github.com/BenjaminLucier/gauntlet")[github.com/BenjaminLucier/gauntlet],
    "Author & Maintainer",
    "",
    [Rust TUI with 128 practice problems that tests solutions on save and benchmarks them against reference solutions, published on #link("https://crates.io/crates/gauntlet")[crates.io] and Homebrew.],
  )
]

#section("Projects")[
  #entry(
    "Incredible",
    link("https://useincredible.com")[useincredible.com],
    "Founder & Lead Engineer — Public Alpha",
    "",
    [Personal "everything app" unifying notes, goals, fitness, flashcards, habits, bases, files, canvas and AI chat.],
    [Rust (axum, Postgres) API, SolidJS frontend and a WebGPU graph view in Rust/wasm.],
    linkedin: (title: "Founder", start: "Oct 2026", end: "Present"),
  )
  #entry(
    "PXStudio",
    link("https://pxstud.io")[pxstud.io],
    "Founder & Lead Engineer",
    "",
    [Pixel art and animation editor for web and desktop (Tauri), with premium cloud sync (Rust, SolidJS, TypeGPU).],
    [Sandboxed Lua 5.4 (WASM) scripting engine for user-written tools and automation.],
    linkedin: (title: "Founder", start: "Oct 2026", end: "Present"),
  )
  #entry(
    "Travel Nexus",
    link("https://travel.nexus")[travel.nexus],
    "Founder & Lead Engineer — Public Alpha",
    "",
    [Map-first trip planner with shareable, forkable trips and place collections, per-place climate data and Stripe billing.],
    [Built a Rust data pipeline over \~1 TB of OpenStreetMap, Wikidata, Wikipedia and CHELSA climate data to curate places into PostGIS.],
  )
  #entry(
    "Portfolio",
    link("https://benjaminlucier.com")[benjaminlucier.com],
    "",
    "",
    [Portfolio and showcase built with SolidJS 2.0, TypeScript and Vite on Cloudflare Workers.],
  )
]

#section("Technical Skills")[
  #let skill(label, items) = par[#strong[#label:] #items]
  #skill("Languages", [Python, TypeScript, Rust, SQL, GraphQL, JavaScript, HTML, CSS])
  #skill(
    "ML",
    [Numpy, Pandas, Matplotlib, SciKit-Learn, XGBoost, PyTorch, MLflow, LangChain, LangGraph, Rig, OpenRouter],
  )
  #skill(
    "Web Dev",
    [Django, FastAPI, React, NextJS, SolidJS, TanStack, TailwindCSS, Tokio, Axum, SQLx, PostgreSQL],
  )
  #skill(
    "Infrastructure & DevOps",
    [AWS (EC2, S3, ECS, RDS, VPC, Route53 & IAM), Terraform, Docker, Neon, Fly.io, Cloudflare (Workers, R2), Vercel, GitHub Actions CI/CD, Infisical, Doppler],
  )
  #skill("Other", [Stripe, WorkOS, PostGIS, pgvector, Redis, Mixpanel, Airtable, Segment, Hasura, MapLibre])
]
