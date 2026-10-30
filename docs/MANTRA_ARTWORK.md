# Mantra artwork and the zero-cost approach

The implementation reuses the six existing full portraits and thumbnails in
`assets/deities/`, the Home/navigation mantra icon, and the existing Ram Navami
and Saraswati Puja compositions. Each deity is referenced once; the app does not
create hundreds of duplicate images for hundreds of texts. Vishnu, Kali, Surya,
Shani and daily prayers have typographic sacred-symbol fallbacks.

No Sanatan logo, screenshots, recordings or artwork was copied. No paid image API
or image-generation subscription integration is required. The repository's
existing art provenance is unchanged; reusing it is not a certification of its
rights (see the existing calendar documentation).

For optional new portraits, use the owner's existing image-generation subscription
interactively and save the exported files locally. Use the existing portraits as
style references, not a competitor's images. Keep generated metadata and review
the hands, faces, attributes and devotional iconography before publishing.

Reusable art brief:

> A respectful devotional portrait of [deity], matching Bhakti's existing warm
> temple artwork: softly illuminated brass and amber, warm golden light, natural
> richly detailed fabric, calm dignified expression, carefully rendered traditional
> attributes, uncluttered centered composition with space around the head.
> No text, lettering, watermarks, modern logos or imitation of a named artist.
> Square composition. Preserve a clear silhouette at thumbnail size.

Suggested attributes for review: Saraswati's veena and white lotus; Rama's bow;
Vishnu's conch and discus; Kali's traditional iconography; Surya's solar radiance;
Shani's traditional mount and attributes. These are review prompts, not a claim
that a generated image is iconographically authoritative.

Export optimized thumbnail and detail versions, retain original source files
separately, then update the corresponding `DEITY_OPTIONS` asset references in
`src/data/mantrasData.js`. Static images do not create recurring API charges.
For sourced alternatives, choose images whose individual Wikimedia Commons file
pages explicitly identify public-domain or suitable Creative Commons terms and
retain that file's creator, source and license; a search result alone is not a
reuse license.
