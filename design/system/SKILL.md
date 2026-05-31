---
name: stride-design
description: Use this skill to generate well-branded interfaces and assets for Stride, Singapore's one-stop health app (Move. Eat. Connect.), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

Key anchors to remember:
- Stride is **light-themed, calm, clinical** — NOT the dark neon aesthetic in the legacy `src/` codebase. The refresh is the source of truth.
- No emoji. No streak counters. No water tracker. No social feed. No gamified XP.
- One hero number per screen. Generous whitespace. Rounded geometry (16 px default radius).
- Calm green `#1E7F5C` is the primary brand. Bright green `#13A26B` is success-only. Warm amber `#F2A93B` for attention. Muted red `#D04E36` for errors.
- System font stack. Hero numerals are 56–72 px, weight 800, tabular.
- Icons are custom 24×24 SVG, 1.75 px stroke, rounded caps — located in `assets/icons/`.
- Voice: knowledgeable friend, second person, plain English, no hype.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
