# Tamil Practice App — Project Context

A small, throwaway flashcard app for learning Tamil vocabulary. Built to be
zero-dependency, zero-build, and easy to host on GitHub Pages. This file is
context for continuing development in Claude Code.

## Goal / intent

The owner is learning Tamil chapter by chapter. For each chapter they collect
word/sentence entries (Tamil pronunciation, English meaning, optional notes),
then self-quiz on them. The app is intentionally disposable — it will be
abandoned once they're fluent, so it favors simplicity and low maintenance
over architecture.

## Tech stack

Plain HTML/CSS/JS. No framework, no bundler, no npm install, no build step.
Open `index.html` directly in a browser, or serve the folder as static files
(e.g. GitHub Pages). Fonts are loaded from Google Fonts CDN (Space Grotesk +
Noto Sans Tamil, the latter only used for the "தமிழ்" brand mark since word
script was removed — see Data model below).

## File structure

```
index.html   Page shell: font links, the SVG "kolam dot" motif def, mounts #app, loads data.js then app.js
style.css    All styling. CSS custom properties for the color/type tokens live at the top of the file.
data.js      const TAMIL_DATA = {...}: all app content (see Data model)
app.js       All app logic: rendering and the quiz engine. Vanilla DOM (no JSX/virtual DOM).
```

There is no build step and no `package.json`. These 4 files are the entire
deployable app.

## Data model

This is the part most worth understanding before making changes.

- **The app is read-only.** `app.js` renders straight from `TAMIL_DATA` in
  `data.js`. There is no editing UI, no localStorage, and no sync/export.
- **To add or change content**, edit `data.js`, commit, and push. GitHub
  Pages redeploys automatically.
- This is a deliberate choice by the owner. Earlier versions kept a
  localStorage working copy with in-browser add/edit/delete and a Sync tab
  (download `data.js` / discard local edits). That was removed because saved
  browser data hid updates to `data.js`. Don't reintroduce browser-side
  persistence of content without asking.
- Old browsers may still hold a stale `tamilAppData` localStorage key from
  those versions. It is ignored and harmless.

### Data shape

```js
{
  chapters: [
    {
      id: "ch-greetings",
      name: "Chapter 1: Greetings",
      notes: "Invitations: ...\n\nFirst names: ...",   // chapter-level notes (plain text)
      words: [
        { id: "w-g01", pronunciation: "vaNakkam", english: "Hello", notes: "Short note..." }
      ]
    }
  ]
}
```

- IDs are hand-written in `data.js`. They only need to be unique; the app
  uses chapter IDs for selection and quiz filtering. Convention:
  `ch-<topic>` for chapters, `w-<chapter letter><nn>` for words (e.g.
  `w-g01`).
- `chapter.notes` holds chapter-level notes: cultural points and tips that
  apply to the whole chapter rather than one word. It's plain text, with
  points separated by blank lines (`\n\n`), and optional. The panel is
  hidden when it's empty.
- `word.notes` is optional (`""` for none).

Word entries used to have a `tamil` field with native Tamil script. The owner
switched to romanized `pronunciation` only. If native script comes back, add
a field for it. The `--font-ta` (Noto Sans Tamil) CSS variable is already
defined and only used by the sidebar brand mark.

## Features implemented

1. **Chapters**: listed in the sidebar with word counts. Selecting one opens
   its Words view.
2. **Chapter notes**: a panel at the top of the Words view shows
   `chapter.notes`, rendered with `white-space: pre-wrap`. It's not shown in
   the quiz.
3. **Words**: a read-only table (pronunciation / English / notes) per chapter.
4. **Quiz**
   - Setup screen: pick chapters (multi-select chips, or "All chapters"),
     pick direction (`ta-en` = Pronunciation→English, `en-ta` =
     English→Pronunciation, or `mixed` = random per card).
   - Runs as a shuffled queue of flashcards. Each card: show prompt → reveal
     button → shows answer + word notes → "Knew it" / "Didn't know it" →
     next card.
   - Session score (known/unknown %) shown at the end. **Not persisted**:
     explicit requirement, quiz is a fresh session every time, no
     spaced-repetition state is kept across runs.

## Content conventions (adding chapters from PDFs)

The owner provides one PDF per chapter (numbered entries with English, Tamil
script, romanized pronunciation, per-entry notes, and "Cultural point"
paragraphs). Workflow: extract the PDF, show the owner a summary of the
proposed entries, and wait for their changes before editing `data.js`.

- **Pronunciation:** keep the PDF's spelling and capitalization exactly
  (e.g. `vaNakkam`, `saaptiinggaLaa?`). Capital N/L/R mark Tamil sounds that
  have no English letter, so don't lowercase or "fix" them.
- **Word notes:** short versions, one or two lines, not the full PDF text.
- **Cultural points / general tips:** go in the chapter's `notes`, not on
  individual words. Write each as a short `Topic: text` paragraph.
- **Keep every PDF entry**, even ones the PDF calls rarely used (e.g.
  "Good morning"). Put that caveat in the word's note.

## Design system (if touching UI)

Dark palette (`:root` in `style.css`):
- `--bg` / `--bg-panel` / `--bg-raised`: near-black ink navy layers
- `--accent` (`#E8A33D`, marigold/turmeric) — primary interactive color
- `--accent2` (`#C2185B`, oleander pink) — used sparingly
- `--good` / `--bad` for quiz answer buttons
- Fonts: `Space Grotesk` for UI/headings (`--font-en`), system font stack for
  body text (`--font-body`), `Noto Sans Tamil` (`--font-ta`) reserved for
  actual Tamil script (currently only the brand mark)
- Signature motif: a small "kolam" dot-grid SVG (`#kolam-dots` symbol
  defined inline in `index.html`) used as decorative corners on the quiz
  flashcard — a nod to the South Indian kolam/rangoli tradition. Reused via
  `<use href="#kolam-dots"/>`.
- Responsive breakpoint at 760px collapses the sidebar to a horizontal bar.

## Known constraints / things to watch

- No automated tests. Checked via `node --check` plus manual browser runs
  (serve with `python3 -m http.server 8765`; `.claude/launch.json` has this
  as the `tamil-app` preview config). Opening `index.html` via `file://`
  works in a normal browser but not in the Claude desktop preview pane.
- No accessibility audit beyond basic focus-visible styling and semantic
  buttons; worth a pass if this grows.
- `data.js` is loaded as a plain script, so a syntax error there blanks the
  whole app. Run `node --check data.js` after editing it.

## Possible next steps (not yet requested, just ideas)

- Spaced repetition / "due for review" logic if the owner wants quiz results
  persisted (currently intentionally session-only).
- Search/filter across chapters in the Words view once there are many
  chapters.

## Deployment

Static files, no build. Hosted from the GitHub repo
`randomcode0708/language-learner` (private), `main` branch, repo root, via
GitHub Pages. Every push to `main` redeploys. `.nojekyll` at the root skips
Jekyll processing.
