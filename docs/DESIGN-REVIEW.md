# Portfolio design review

Scope: the live portfolio build at `main`, rendered at 1440 px (desktop) and 390 px (phone), plus Lighthouse on the local build. Scores are out of 10 and reflect what was measured or seen in the renders. This review does not include a visual reference board or competing art directions; those are the next step, before any redesign.

## Scorecard

| Area | Score | Evidence | Main gap |
|---|---|---|---|
| Visual identity | 7 | Serif display face with a warm accent on a near-black ground; a consistent look across sections | The accent is used in many places; it could be reserved for a few moments |
| Typography | 8 | Instrument Serif for display, Inter Tight for text; clear hierarchy; body measure 60 to 71 characters per line on desktop | Labels and metadata were below 14 px (fixed in the P1 pass) |
| Colour | 7 | One accent and one neutral ground; consistent across sections | Contrast passes Lighthouse (accessibility 100), but the muted grey body copy is close to the limit |
| Layout | 6 | Clear section rhythm, generous spacing | The hero's right half is empty; the dashboard case-study image renders much smaller than the SpendVoice image beside it |
| Projects | 6 | Two case studies with real screenshots and stated decisions | The remaining project tiles repeat one template (tag, title, text, links) |
| Motion | 7 | Word-by-word hero entrance, scroll reveals, image wipe, custom cursor, reduced-motion support | The same reveal is used on almost every element, so it stops feeling deliberate |
| UX | 7 | Clear navigation, one contact path, a resume request form, sound off by default | The resume request is an email, so the form itself has no feedback |
| Credibility | 8 | Metrics and roles match the resume; case studies state what was verified | None significant |

## Measurements

- Lighthouse (local build): performance 88, accessibility 100, best practices 96, SEO 100. Largest Contentful Paint 2.8 s (target 2.5 s). Cumulative layout shift 0.
- Overflow: 0 px horizontal scroll at both widths.
- Console and page errors: none at either width.
- Characters per line in the about and case text, measured with canvas text metrics: 60 to 71 on desktop, 46 to 51 on phone. The comfortable range is about 45 to 75, so the measure is fine. An earlier draft of this review reported 28 and 21 because it divided width by font size, which measures em units, not characters. That finding is withdrawn.
- Phone: the case-study section is about 3,200 px tall, the longest section on the page.

## Ranked backlog

Each item has acceptance criteria so it can be checked without judgement.

**P1, fixed in the P1 pass**
1. **Case-study figures collapsed before their images loaded.** The phone figure had zero width until its lazy image arrived, which caused layout shift. The dashboard image was not actually undersized; my full-page capture simply hadn't loaded it. Result: both figures hold a fixed width. Layout shift is now 0.005.
2. ~~Measure too narrow.~~ Withdrawn. The measure is 60 to 71 characters per line on desktop.
3. **Text below 14 px.** Labels, metadata, and buttons raised to at least 14 px.
4. **LCP 2.8 s.** Fixed by removing the hero's opacity fade and self-hosting the two font families, which removed a cross-origin font request. Result: LCP 1.8 s, performance 99.

**P2, before the redesign**
5. **Empty hero composition.** Acceptance: the hero's right side holds a deliberate element, such as a project image or a typographic detail, or the hero is composed around the left column on purpose.
6. **Repeated project tiles.** Acceptance: the remaining projects use at least two distinct layouts, not one template.
7. **Uniform reveal.** Acceptance: at least three different entrance treatments, each tied to a section's role.

**P3, later**
8. **Reference board and art directions.** Three competing directions, reviewed before any redesign.
9. **Sound design.** Off by default; any sound must be designed and tested on real devices before it is claimed.

## What this review did not do

- It did not test on real devices, slow networks, or other browsers.
- It did not produce a reference board or an external design review. The Pinterest and portfolio-review references in the brief were not consulted.
- It did not measure animation smoothness on low-power devices.
