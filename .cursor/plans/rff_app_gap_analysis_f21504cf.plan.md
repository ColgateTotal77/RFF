---
name: RFF App Gap Analysis
overview: "Feature analysis across three tiers: what a basic reader needs, what a language-learning reader needs, and interesting ideas to elevate UX."
todos: []
isProject: false
---

# RFF App — Feature Gap Analysis

## What's currently working
- EPUB loading and rendering (WebView + chunked blocks)
- Book library with two lists (Reading Now / Have Read)
- In-book search with hit navigation
- TOC navigation
- Light/dark theme toggle
- Reading position auto-restore
- Chapter + overall progress bars
- Word selection → Anki card creation
- Anki deck/model/field mapping (global + per-book overrides)
- Word highlighting in text via C trie (flag colors by review tier)
- Word frequency database (per language)
- Word metadata from Supabase (GPT → Reverso → Gemini → Groq fallback chain)
- Word forms / lemma database with Supabase sync
- Mirrored Anki notes (front/back pairs)
- Auto-card on double-tap toggle
- System translator integration
- Per-book language settings

---

## 1. Missing — Basic Reader

These are features users expect from any e-reader before anything else.

### Library management
- **No library sorting or filtering** — books cannot be sorted by title, author, date added, or last read; no search within the library
- **No book metadata editing** — title, author, cover art are fixed at import; no way to correct a bad EPUB header
- **No empty-state UI** — the book list shows a blank screen when empty; no "Add your first book" prompt or illustration
- **No book import from cloud** — only local file picker; no Dropbox, Google Drive, or direct URL import
- **No book cover display** — `BookCard` shows title/author but no cover thumbnail even though EPUB cover images are available

### In-book reading
- **No bookmarks** — users cannot drop a named bookmark or return to a saved location; only the last auto-saved position is remembered
- **No text highlights or annotations** — no way to highlight a passage in a color or attach a personal note to text without going through Anki
- **No font / typography settings in a visible place** — font size/family exist in the engine but are not exposed in a user-facing settings panel
- **No line spacing / margin controls**
- **No full-screen / immersive reading mode** — header and footer are always visible, reducing reading area
- **No landscape reading support consideration** — layout may not adapt cleanly to landscape

### Navigation
- **No "jump to position" by chapter name typed input** — TOC exists but requires scrolling through a potentially long list
- **No page number concept** — progress is shown as %, no page-equivalent number for users who think in pages
- **No back-navigation after following an internal book link** — `BOOK_LINK_PRESSED` navigates to another chapter but there is no back button to return

### Notifications / background
- **No reading reminders** — no local notification to remind the user to continue reading
- **No background sync status** — word-form sync from Supabase runs silently with no user-visible indicator

---

## 2. Missing — Language Learning Reader

These are the features that make this app different from just Kindle.

### Word lookup experience
- **No inline word popup** — tapping a word opens the system translator or creates a card immediately; there is no intermediate bottom sheet showing the fetched definition/synonyms/examples before committing to a card. The `get-word-metadata` API and `SelectionMenu` infrastructure already exist — they just need a display layer.
- **No sentence-level translation** — only single-word lookup is supported; selecting a full sentence has no dedicated translation path
- **Context sentence not included in card** — when a card is created, the sentence the word appeared in is not attached as context. This is the single most important quality improvement for SRS cards.
- **No "mark as known" / ignore list** — users cannot mark a word as already known to suppress the selection menu prompt without creating an Anki card
- **No lemma-aware search** — searching "ran" in-book won't find "run"; `word_forms` table exists but is not connected to `searchInBook`

### Vocabulary management
- **No vocabulary list per book** — no screen showing all words looked up or tagged within a specific book
- **No global vocabulary screen** — no overview of all words across all books, their frequency tier, review status, or when they were added
- **No session summary** — after closing a book, there is no "you looked up 12 words today" recap screen
- **No known words % per book/chapter** — the `FrequencyDatabase` and trie exist; "X% of this chapter's words are above Top_5000" is computable but not shown
- **No flag color legend** — `anki-word` spans use 8 flag colors representing review tiers, but there is no visible legend anywhere in the UI explaining what each color means

### Learning tools
- **No frequency overlay mode** — the frequency database is downloaded and queried, but there is no toggle to visually shade all words in the text by their frequency tier (a feature that would help users gauge difficulty at a glance)
- **No in-app pronunciation** — TTS exists for Anki card audio generation but is not exposed as a "tap to hear" button on the inline word popup
- **No grammar / conjugation notes** — definition cards have no structured grammar field (part of speech, conjugation table, gender for nouns)
- **No parallel text mode** — reading original text alongside a translation sentence-by-sentence (useful for beginners)

---

## 3. Interesting Ideas

### Reading experience upgrades
- **Book difficulty score on library card** — at import time, run the book's text through `FrequencyDatabase` and show a badge: "A2 / B1 / C1" or "42% words above Top_5000." Helps users choose what to read next based on their current level.
- **Reading timer + WPM tracker** — use `SCROLL_POSITION_CHANGED` events to measure active reading time and estimate words-per-minute. Show "~18 min left in chapter" in the footer.
- **Vocabulary heat map** — a calendar view (like GitHub contributions) where each day's square intensity reflects how many new words were looked up. Motivating for daily learners.
- **Reading streaks** — a daily reading goal (e.g. 15 min or 10 pages) with a streak counter and a simple badge reward. Trivial to implement with the reading timer above.
- **Smart card preview before adding** — before sending to Anki, show a card preview (front/back rendered) so the user can edit fields, swap example sentences, or pick a different translation from the alternatives already returned by the API.

### Vocabulary & export
- **Export vocabulary to CSV / Markdown** — one-tap export of all words from a book (or globally) with their definitions, for users who use tools other than Anki or want to review outside the app.
- **Shareable word card image** — generate a simple image (word + definition + book example sentence) for sharing to social media or messaging. Good organic marketing.
- **"Word of the session" end card** — pick the most interesting (rarest / highest flagged) word from the session and show it as a closing screen when the user puts the book down.

### AI-powered features
- **AI reading assistant** — a chat panel (slide in from the side) where the user can ask questions about what they just read: "What did this idiom mean?", "Summarize what happened in this chapter," "What's the grammar rule here?" Uses the current block's text as context.
- **Auto-generated book glossary** — on first open, scan the top N rarest words (by frequency tier) and pre-fetch their definitions in the background, so first-lookup is instant for the hardest words in the book.
- **Difficulty-adaptive font sizing** — automatically reduce font size (show more text per screen) for easy chapters and increase it for dense/technical chapters, based on the average frequency tier of words on screen.

### Social & gamification
- **Reading challenges** — "Read 3 books in this language this month" / "Look up 50 new words this week." Simple goal system with progress rings.
- **Vocabulary comparison between books** — "War and Peace introduced 340 new words for you; this book has 180 so far." Helps users appreciate vocabulary breadth.

