# S8ULverse — Legacy Rosters & Brand Partners
### A plain-English overview (no technical background needed)

*This document explains, in everyday language, a new section being added to the
S8ULverse website. It's written so anyone can follow it — you don't need to know
anything about coding.*

---

## 1. What is this, in one line?

We're adding two big things to the S8ULverse site:

1. **Legacy team pages** — a "hall of fame" for each team (Team SouL and 8Bit) showing
   **every player who has ever been on the roster**, when they joined, when they left,
   and what they won.
2. **A partners section** — showing the **brands and sponsors** each org works with, and
   which players or creators are involved with each brand.

Think of it as turning the site from "here are our current players" into "here is our
whole story — every player, every era, every trophy, every sponsor."

---

## 2. Why are we doing it?

Right now the site mostly shows the **current** roster. But the real story of these orgs
is their **history** — the legends who built Team SouL, the players who came and went, the
trophies they lifted along the way. Fans want that history. It also makes the site far
more valuable: a complete, official record nobody else has.

---

## 3. What will visitors actually see?

| New thing | What a visitor sees |
|---|---|
| **Team legacy page** (one per org) | A page for Team SouL (and 8Bit) with a cinematic header, the **current lineup**, a section of **past players ("alumni")**, the **coaches/staff**, a **trophy wall**, and the team's **sponsors**. |
| **Every player's tenure** | On each player's card: when they joined and left (e.g. "Mar 2019 – Aug 2021"), a **"Day one"** badge for founders, and a **"Former member"** tag for those who've left. |
| **Trophy wall** | A grid of the team's trophies — each showing the event, the year, the result (Champion, Runner-up…), and small photos of the **players who won it**. |
| **Player profiles (upgraded)** | Each player page gains their **full career timeline across teams**, their **personal honours**, and the **brands** they work with. |
| **Partners hub** | A dedicated page listing all brand partnerships, filterable by org, plus a partners section on each team page. |

A real example the system handles correctly: **MortaL** founded Team SouL, then moved up
to S8UL. So he shows up on **SouL's page as a founding alumnus** *and* on **S8UL as
current** — both true at once. Little details like that are the whole point.

---

## 4. What will *you* (the people running the site) get to manage?

Everything is editable from the website's admin area — no developer needed for day-to-day
updates:

- Add a player, set when they **joined/left** each team, mark founders.
- Record a **trophy** and tag which players won it.
- Add a **sponsor**, choose which orgs/players it involves.
- All the page text (headings, intros) stays editable too.

The site **updates the moment you save** — no waiting, no rebuilds.

---

## 5. Letting more people help (user roles)

Today the site has one all-powerful login. We're adding **four levels of access** so you
can safely bring in helpers:

| Role | Can do |
|---|---|
| **Owner** | Everything (you). |
| **Admin** | Manage all content and other users. |
| **Editor** | Manage all content and site text. |
| **Contributor** | Only add/edit **players, trophies, and sponsors** — perfect for someone helping enter the historical data, without access to settings. |

Importantly, this also **fixes a security gap**: right now *any* logged-in helper could
change anything (and even promote themselves). The new system locks that down properly.

---

## 6. How we're keeping it good — quality, speed, safety

We didn't just plan the visible parts. We also planned the "grown-up" foundations:

- **Speed:** even with ~40 player pages, the site stays fast, and editing one player only
  refreshes the pages that actually changed — instantly.
- **Security:** we found and scheduled fixes for **three real issues** that exist today
  (before this feature): a loophole where bad text could run code, the access problem
  above, and the database being reachable from the outside. All three get closed.
- **Accessibility:** the new pages work for keyboard-only users, screen readers, and
  people who prefer reduced on-screen motion — and we're fixing a couple of existing gaps
  while we're at it.

---

## 7. The honest part — where the real work is

Building the pages is the **easy** part. The **biggest effort is the data**: we need to
enter **around 40 players** (current and historical) and roughly **70 "stints"** (each
player's time at each team), plus their trophies and sponsors.

The good news:
- We've already **sourced the real history** from Liquipedia (the esports record-keeper) —
  names, dates, who won what.
- The site is built so it **ships before every profile is 100% complete** — pages work
  even while photos/social links are still being filled in.
- A **Contributor** helper (see roles above) can do this data entry safely.

One open item needs **your confirmation**: the **8Bit founders** — the public record
didn't list them, so we need you to confirm who they are.

---

## 8. Where things stand

- **The plan is 100% finished and reviewed** — every detail decided, checked six times
  over, and signed off. Eighteen detailed planning documents back it up.
- **No building has started yet** — that was deliberate. We planned thoroughly first.
- **Next step:** begin construction (the developer work), starting with the three
  security fixes since those matter today regardless of the new feature.

---

## 9. Mini-glossary (the few terms you might hear)

- **Roster** — the list of players on a team.
- **Alumni / former members** — players who used to be on the team.
- **Tenure / stint** — one period a player spent at a team (a join-to-leave span).
- **Honours / titles** — trophies and awards won.
- **Org** — organization (S8UL, Team SouL, 8Bit, 8Bit Creative).
- **Admin area** — the private, password-protected part of the site where the team edits
  content.

---

*In short: we're giving each team a complete, beautiful, official history — every player,
every trophy, every sponsor — built on solid, secure, fast foundations, and easy for your
team to keep up to date.*
