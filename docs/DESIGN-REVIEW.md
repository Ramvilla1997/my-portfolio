# Portfolio design review

Scope: the live portfolio build at `main`, rendered at 1440 px (desktop) and 390 px (phone), plus Lighthouse on the local build. Scores are out of 10 and reflect what was measured or seen in the renders. This review does not include a visual reference board or competing art directions; those are the next step, before any redesign.

## Scorecard

| Area | Score | Evidence | Main gap |
|---|---|---|---|
| Visual identity | 7 | Serif display face with a warm accent on a near-black ground; a consistent look across sections | The accent is used in many places; it could be reserved for a few moments |
| Typography | 7 | Instrument Serif for display, Inter Tight for text; clear hierarchy | Smallest body text is 12 px; desktop measure averages 28 characters per line in the about and case text |
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
- Chars per line in the about and case text: 28 desktop, 21 phone. The comfortable range for body text is about 45 to 75.
- Phone: the case-study section is about 3,200 px tall, the longest section on the page.

## Ranked backlog

Each item has acceptance criteria so it can be checked without judgement.

**P1, fix now**
1. **Dashboard case-study image undersized.** Acceptance: the dashboard image fills its column at desktop width, at the same visual weight as the SpendVoice image.
2. **Measure too narrow.** Acceptance: about and case-study body text averages 45 to 75 characters per line at desktop width, and stays readable at phone width.
3. **Smallest text is 12 px.** Acceptance: no body or label text below 14 px.
4. **LCP 2.8 s.** Acceptance: LCP at or below 2.5 s on the local build, by showing the hero headline immediately rather than fading it in.

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
