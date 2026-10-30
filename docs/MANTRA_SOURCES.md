# Mantra library: sources, reuse and maintenance

The bundled corpus contains **81 named devotional texts and invocations** and **700 Bhagavad Gita shlokas across 18 chapters**, for **781 records**. These are distinct collections; the app must not advertise the Gita verses as 700 different devotional mantras. Read `src/data/mantra-corpus/stats.json` for generated counts.

No subscription, API key, paid dataset or runtime content request is required. The app reads bundled JSON offline. The source snapshots and importer make the content reviewable and reproducible.

## Sources actually included

| Source | Included content | Reuse basis |
| --- | --- | --- |
| [Sanskrit Wikisource](https://sa.wikisource.org/) | 73 devotional texts or complete named prayers selected from longer works; all 700 Gita verses | CC BY-SA 4.0 for the supplied transcription/adaptation. Every entry links its exact page revision and credits contributors. |
| [Nitya open data](https://getnitya.com/en/about/data/) | Eight complete texts: Hanuman Chalisa; Om Jai Shiv Omkara; Jai Ganesh Deva; Jai Ambe Gauri; Om Jai Lakshmi Mata; Saraswati Vandana; Madhurashtakam; Mahalakshmi Ashtakam | The source explicitly marks its **text-only JSON** public domain, usable for any purpose. Credit and links are retained. |

Nitya's web-page meanings, notes and summaries use a **noncommercial** license and are not included. Its JSON contains textual lines and optional word forms, not those translations. For example, the [Hanuman Chalisa JSON](https://getnitya.com/data/hanuman/chalisa/dev.json) supplies 43 sections: two opening dohas, 40 chaupais and the closing doha. All are bundled. Nitya asks consumers to cache data and avoid downloading the whole set more than once daily.

Sanskrit Wikisource's [copyright guidance](https://wikisource.org/wiki/Help:Copyright) and the [CC BY-SA 4.0 terms](https://creativecommons.org/licenses/by-sa/4.0/) permit reuse, including commercial reuse, with attribution and share-alike obligations for adapted content. Keep the per-entry source link, contributor attribution, license link and modification notice visible when redistributing the transcription or its script adaptations. The data notice is in `src/data/mantra-corpus/LICENSE.md`; it does not change the license of unrelated application code.

## What is stored

- `manifest.json`: Wikisource work titles, stable IDs, deity/category, selected boundaries and explicit editorial corrections.
- `sources.json`: pinned Wikisource page title, revision ID, fetched-response SHA-256 and source wikitext. Gita snapshots retain only root-text poem blocks, excluding commentaries; their SHA-256 identifies the original fetched page response, not the shortened stored blocks.
- `nitya-manifest.json`: selected public-domain JSON paths and expected section counts.
- `nitya-sources.json`: exact source URL, response SHA-256 and parsed text-only JSON. Current responses are compact JSON; their checksums are independently checked by corpus tests.
- `summaries.json`, `summaries-additional.json`, `gita-summaries.json`: original, concise English, Hindi and Bengali thematic summaries created for this app.
- `library.json`: generated reader data with source, license and attribution on each entry.
- `stats.json`: generated corpus counts.

The `textSource` field points to a permanent Wikisource revision or the Nitya JSON; `sourceUrl` is the reader-facing source page. `sourceRevision` is the Wikisource revision number or Nitya response hash. The importer never reads translations from modern commercial editions.

## Languages and editorial limits

All 81 devotional works and invocations have original English, Hindi and Bengali **thematic summaries**, not line-by-line translations. There are also original summaries for 25 selected Gita verses. The other 675 Gita verses deliberately have no supplied meaning; the UI must say it is unavailable rather than invent one. These summaries are not a claim of scholarly or religious certification.

`textBn` renders the original Sanskrit, Hindi or Awadhi mechanically in Bengali script. It is **not a Bengali translation**. `transliteration` is a mechanical Roman rendering, preserving written vowels; particularly for Hindi/Awadhi it is not a pronunciation guide. Om is represented as `ওঁ`; punctuation is preserved. The reader must keep the script and meaning labels distinct.

The importer removes web navigation, templates, speaker headings and chapter colophons. Explicit corrections are listed in each manifest record and emitted as `editorialChanges`: for example, a mixed Latin letter in Panduranga Ashtakam, the ASCII avagraha in Purusha Suktam, and a duplicated verse number in Ganesha Pancharatnam. The cleaner Nitya Madhurashtakam supersedes the earlier Wikisource transcription. No attempt is made to flatten legitimate differences between traditional editions.

Each short named invocation is complete even when selected from a larger work. `excerptOf` identifies that containing work. A Gita entry is one complete numbered shloka, and all 700 are available in the collection. Full imported texts replace the former one-line placeholders for Hanuman Chalisa, Rama Raksha, Saraswati Vandana and the four aartis while preserving stable IDs.

Two legacy IDs are retained for saved-item compatibility while their labels and text are corrected: `hanuman-kavach` now contains the short **Om Hanumate Namah** invocation from Anjaneya Sahasranamavali, categorized as a mantra rather than a kavach. `lakshmi-mantra` contains the attested **Om Mahalakshmyai Namah** salutation from Gayatri Sahasranamavali; the former unsourced Shreem prefix is not included. Neither record claims to be a complete protective hymn.

The importer checks verse numbering, all 18 expected Gita chapter lengths, at least two poetic lines per verse in the pinned edition, source existence, section counts and duplicate IDs. Independent corpus tests check source provenance, no markup/Latin contamination in native text, script conversion, original-summary coverage and inclusion of every Nitya section. Regression checks preserve the genuine verse lines beginning “इति” in 4.14, 10.8, 13.18, 15.20 and 18.63, which must not be mistaken for colophons. This establishes reproducible extraction, not a manuscript-critical edition. Text corrections should be reviewed against the linked edition and recorded explicitly.

## Rebuilding and extending

```sh
# Deterministic, offline: regenerate library.json and stats.json.
node scripts/import-mantra-corpus.cjs

# Fetch only missing manifest sources, retaining all pinned existing revisions.
node scripts/import-mantra-corpus.cjs --refresh

# Intentionally update pinned sources, then review the resulting text diff.
node scripts/import-mantra-corpus.cjs --refresh --update-existing

# Corpus tests (also part of npm test).
node --test tests/mantra-corpus.test.cjs
```

Add a genuine complete work to the relevant manifest, check its authorship and source reuse terms, supply original summaries or leave them explicitly absent, fetch once, and inspect the generated text and attribution. Keep text-only endpoints separate from translation endpoints. Do not introduce invented variants or repeated one-line entries to inflate the catalog count.

## Free artwork and recordings

The reference is [Sanatan, package com.duolop.sanatan](https://play.google.com/store/apps/details?id=com.duolop.sanatan). Its screenshots are design references, not a source license for its illustrations, logo, text compilation or audio.

The app's artwork approach is documented in `docs/MANTRA_ARTWORK.md`. Original symbols and still art can be bundled without a runtime image-generation service. Existing ChatGPT or Google subscriptions can be used to make still assets, subject to the chosen product's terms; neither subscription is treated as a free API for app users.

For an alternative to newly generated art, [Wikimedia Commons reuse guidance](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia) requires checking each file's individual license. Public-domain examples include [Ravi Varma's Lakshmi](https://commons.wikimedia.org/wiki/File:Ravi_Varma-Lakshmi.jpg) and [Raja Ravi Varma's Saraswati](https://commons.wikimedia.org/wiki/File:Raja_Ravi_Varma,_Goddess_Saraswati.jpg). Download only a suitable licensed rendition and keep its file-page attribution; a Google Images result is not permission.

No new audio has been imported. Only the app's existing recordings are retained where the text matches. A public-domain prayer does not make a modern performance or recording public domain. Newly recorded chants with the performer's permission are a zero-license-fee route if more audio is wanted later; no external playback or paid TTS is required for reading and Jaap.

## Sources considered but not imported

- [Sanskrit Documents FAQ](https://sanskritdocuments.org/faq/): the site imposes restrictions on commercial reposting. It is not treated as a blanket freely reusable commercial dataset.
- [IIT Kanpur heritage license](https://heritage.iitk.ac.in/license): distinguishes ancient source text from copyrighted translations. The translations are not imported.
- [Ambuda downloads](https://ambuda.org/texts/downloads/): valuable corpus, but the inspected bundle did not provide sufficiently explicit per-text reuse metadata for this import.
- Modern Bengali Gita translations found on community sites were not copied without clear translator provenance. A CC footer alone does not establish that an uploader owned the translation.

Source terms checked on 28 October 2026. Keep the pinned source records even if upstream sites later change their pages or terms.
