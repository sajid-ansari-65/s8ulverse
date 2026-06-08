# Deep-dive M — Data sourcing (rosters · honours · sponsors)

Status: **DESIGN LOCKED** (agenda item M of [PLAN-brand-legacy.md](./PLAN-brand-legacy.md))
Locked: **D-M1** all historical players (incl. departed) · **D-M2** full profiles for
everyone (phased enrichment; data entry is the dominant project cost).
The research workstream that feeds real data into the A/C/D model. Primary source:
**Liquipedia** (player/team pages, dated transfer history) + the existing seed.

---

## M0. Method, sources & rules

- **Sources:** Liquipedia PUBGM wiki (per-team + per-player pages — dated transfers),
  cross-checked vs the current `seed.ts` roster and Wikipedia (S8UL honours).
- **Liquipedia gives day-precise dates** (e.g. `2018-12-21`) — *better* than the
  month+year our model needs, so we store the exact date (picker pins to month anyway).
  Our "month+year minimum" was conservative; real data is finer.
- **Verification rule:** a player/tenure enters the dataset only with a Liquipedia (or
  official-social) date; unknown months → `note` flag, never blocked.
- **Attribution:** Liquipedia is CC-BY-SA. We're compiling *facts* (who played when —
  not copyrightable) into our DB; a small "roster history via Liquipedia" credit on the
  org page is courteous. (Not the API — one-time manual sourcing.)
- **Confidence grading** in the tables: ✅ dated & cross-checked · 🟡 dated, single
  source · ⚠ needs user confirmation.

---

## M1. Team SouL — dataset (Liquipedia, ✅ unless noted)

**Founded:** 2018-12-21 · **Founders:** MortaL (Naman Mathur), with Goldy & Thug as
co-owners. **Title sponsor:** iQOO → squad name "Team iQOOSouL".

**Current roster** (matches seed ✅): NakuL (IGL, 2024-01), Goblin (2025-05), LEGIT
(2025-05), Jokerr (2025-07), Thunder (2025-09).

**Key alumni (player tenures):**
| Player | Stint(s) | Founding? |
|---|---|---|
| MortaL | 2018-12-21 → 2023-01-16 (then S8UL) | ✅ founder |
| VipeR | 2018-12-21 → 2023-01-16 | ✅ founder |
| RonaK | 2018-12-21 → 2019-09-10 | ✅ founder |
| Owais | 2018-12-21 → 2019-09-10 | ✅ founder |
| ReGaLToS | 2019 → 2022-04-18 (now 8Bit Creative) | |
| Sc0utOP | 2019-08→09; **2021-07→10** (⚠ see M5) | |
| Omega, AkshaT, Hector | 2022-01/03 → 2023-12 | |
| Manya, Rony, Spower | 2024-01 → 2025-07 (Manya/Rony), 2024-07 (Spower) | |
| **Goblin** | **2022-03→2024-01, then 2025-05→present** (rejoin) | |
| **Jokerr** | **2024-01→2024-08, then 2025-07→present** (rejoin) | |
| + ClutchGod, AMAN, Sangwan, Blaezi, Mavi, RoXX, VIRU, YuvaOP, Deathnote, Neyo, NinjaJOD, Skipz, Saumay, HunterZ | various 2019–2025 | |

**Staff:** Ayogi (analyst 2024→, coach 2025-07→ current), Sid (manager, current),
Mayavi (coach 2024→2025-07), Amit/AMAN (coaches 2022→2023), Sagar (analyst 2020–22),
Euphoria (ops 2023).

---

## M2. 8Bit — dataset (Liquipedia)

**Founded:** 2018 (initial PUBG Mobile phase). **Founder — ✅ USER-CONFIRMED:**
**8bit Thug (Animesh Agarwal)** founded 8Bit in the initial PUBGM phase → OWNER tenure at
8Bit, `isFounding:true`, ~2018. **Current BGMI-lineup owner — ✅ USER-CONFIRMED:**
**Beg4Mercy (Mrinmoy Lahkar)** → OWNER tenure at 8Bit since 2022-04-17.

> Another **multi-org** validation: 8bit Thug = **founder of 8Bit (2018)** → **co-founder
> of S8UL (2022)** → his Tenures span both orgs (already a Member + Founder in the seed).
> So 8Bit's "Day one" founder badge goes to 8bit Thug; Beg4Mercy is the present-day owner.

**Current BGMI roster (⚠ NOT in current seed — all new):** Sarang (2025-10), Juicy
(2025-10), Skipz (2025-10), Shorty (2026-04), Shubh (2026-04).

**Key alumni:** Juicy (2022-04→2024-12), MadMan (2022-09→2023-11), Beast (2022→2023-11),
Mighty (2023-07→2024-12), Ash (2024-12→2025-05), Raiden (2025-10→2026-03), Spower
(2025-07→2025-10). Roster acquisitions: Numen (Dec 2024), Team Versatile (May 2025).

**Staff:** Surya (coach 2022–23), Xypex (coach 2025).

> 8Bit's history is messier (frequent roster acquisitions) and **thinner on Liquipedia**
> than SouL → more ⚠ entries; founder line needs the user.

---

## M3. Honours → members mapping

The honours list (Wikipedia + earlier research): SouL — PMIS 2019, PMCO India 2019,
BMPS 2022, **BGIS 2026**, (+ CEGC 2025, OneGame S1 third-party); S8UL — Content Group of
the Year ×4 (2022–25), Esports Personality 2025 (Thug), Pokémon UNITE ×4, LoL Legends
Ascend 2025, Valorant VCSA Split-1 2026, Chess DreamHack 2026.

**Member attribution is now derivable from tenures:** a trophy's `members` = the roster
**active on that event's date**. E.g. BMPS 2022 → the 2022 SouL squad (Omega, AkshaT,
Hector…); BGIS 2026 → the current five. We cross the event date against M1/M2 tenures to
fill `Achievement.members` accurately — no guessing.

---

## M4. Sponsors → Brands

- **iQOO** — ✅ Title / Naming Rights → `team = Team iQOOSouL`, org SouL, Active.
- Others (S8UL/8Bit have had AMD, Nodwin, etc. partners over time) — **⚠ needs a
  dedicated sponsor sweep** (Liquipedia "Organization" infobox + official socials). Seed
  the iQOO record now; the rest is a follow-up sourcing pass.

---

## M5. Findings that ripple into the plan

1. **Model validated by real data:** Goblin & Jokerr have **rejoins** (→ `formatStints`
   "2022–24 · 2025–present"); MortaL & ReGaLToS are **multi-org** (SouL → S8UL / 8Bit
   Creative) — exactly the cases A's Tenures model exists for.
2. **⚠ Scout vs CLAUDE.md:** Liquipedia shows Sc0utOP as a former SouL player (2019,
   2021). CLAUDE.md says *"Scout is NOT in any S8UL org… Don't seed him"* — that rule was
   about not showing him as **current**. For the **legacy** roster he's an accurate
   **alumnus**. Resolution depends on **D-M1**; if we include external alumni, CLAUDE.md's
   note should be amended to "not current; alumnus only".
3. **Volume:** "all players from day one" = **~25 SouL + ~12 8Bit alumni** Member records
   (many now at rival orgs or family-external). Drives **D-M1** (scope) + **D-M2** (depth).
4. **8Bit gaps:** current BGMI roster is entirely new (not in seed). Leadership **resolved
   → founder 8bit Thug (2018), current owner Beg4Mercy (2022→)**, both user-confirmed.

---

## M6. Mapping to collections & volume

| Entity | Source | Volume (est.) |
|---|---|---|
| **Members** (alumni) | M1/M2 | +25–40 records (depth per D-M2) |
| **Tenures** | M1/M2 dated stints | ~60–80 rows (incl. rejoins as 2 rows) |
| **Achievements** links | M3 | ~15 trophies × roster members |
| **Brands** | M4 | iQOO now; +N after sponsor sweep |

Data lands via **N (seed)** for the verified core + admin entry for the long tail.

---

## M-decisions — LOCKED

- **D-M1** ✅ **All historical players** — incl. those who left for rival orgs (Scout,
  Owais, etc.). Full "from the start" accuracy.
- **D-M2** ✅ **Full profiles for everyone** — every alumnus gets a complete profile
  (avatar, socials, real name, country), not a stub.

### Implications of D-M1 + D-M2 (both maximal)

- **~40 full Member records** to source — each needs avatar + socials + real name +
  country, **plus** tenures + honours. **Data entry is now the dominant cost of the
  whole project**, far exceeding the code.
- **Phasing (recommended, not a re-decision):** the *target* is full profiles for all,
  but the model makes every media/social field optional → **seed the current rosters +
  founders fully first** (verified, complete), then **enrich alumni progressively**
  (create the Member + tenures + honours immediately so they appear in the roster, fill
  avatar/socials over time). A profile mid-enrichment still renders (F mappers null-safe).
  This keeps the feature shippable without blocking on 40 complete profiles.
- **External ex-members** (now at rival orgs, e.g. Scout@Revenant) get full S8ULverse
  profiles reflecting their **S8UL-era**; their current socials link out. Neutral, factual.
- **⚠ Action — CLAUDE.md:** amend the "Scout is NOT in any S8UL org… Don't seed him"
  note to **"not a *current* member; include as a SouL *alumnus* (former tenures) only."**
  (User-owned file — flagged, not auto-edited.) Same applies to any other "don't seed"
  names that are historically accurate alumni.
