# Architecture

Cubby runs on two pipelines: one moves a code change from the editor
into production, the other moves a parent from typing their email to a
signed-in session.

A polished, blueprint-styled version of these diagrams is published here:
https://claude.ai/code/artifact/900d8b43-91bb-46d6-b85c-53e625f3d35f

## 1. Build & deploy pipeline

```mermaid
flowchart LR
  A["VS Code + Claude Code<br/>local workstation"] -->|git push to main| B["GitHub<br/>kjshah6/Family-Ops"]
  B -->|webhook triggers build| C["Vercel<br/>build & deploy"]
```

Every push to `main` triggers a Vercel build automatically — there's no
manual deploy step once this is wired up.

## 2. Runtime & sign-in flow

```mermaid
flowchart LR
  Browser["Parent's Browser"] -->|"1 · HTTPS request"| Vercel["Vercel — Next.js App<br/>better-auth · Prisma · API routes"]
  Vercel <-->|"2 · reads / writes via Prisma"| Neon[("Neon<br/>Postgres")]
  Vercel -->|"3 · sends magic link"| Resend["Resend"]
  Resend -->|"4 · delivers email"| Inbox["Parent's Inbox"]
  Inbox -.->|"5 · clicks link, session starts"| Browser
```

Sign-in has no password: Vercel emails a one-time link through Resend, and
opening it in the inbox is the action that authenticates the browser.

## Stack

| Layer | Tool |
|---|---|
| Editor / agent | VS Code + Claude Code |
| Source control | GitHub (`kjshah6/Family-Ops`) |
| Hosting / deploy | Vercel |
| Database | Neon (Postgres) |
| Email delivery | Resend |
| App framework | Next.js (App Router) |
| ORM | Prisma |
| Auth | better-auth (email magic link + passkeys) |
