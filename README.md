Aqar – To‑Do List from Client Feedback (23–25 Jul 2025)

Source of requirements: WhatsApp messages from Ahmad Mazzaya (23–25 July 2025) + current UI screenshots.
Output language: English
Format: Markdown checklist grouped by priority.

⸻

🔥 Top 10 Priorities (Do First)
	1.	Search bug (For Sale / For Rent returns same results)
	2.	Advanced search & filtration experience (client said it's the most important part)
	3.	Property not shown on Home & Featured sections after adding
	4.	Popular Areas page shows grey skeletons / no data & images flicker/disappear
	5.	Property upload failure (second property didn't upload)
	6.	✅ Category cards lack visible titles – user can't know what they are before clicking
	7.	Add drag & drop ordering for properties in: (a) each Category, (b) Home page Featured list
	8.	✅ Add representative image for each Category
	9.	Define image size guidelines in the property form (before upload)
	10.	SEO meta tags per Property & per Category pages

⸻

✅ Detailed Task Breakdown

1. Search & Filters
	•	Fix status filter logic ("For Sale" vs "For Rent" should return different sets).
	•	Ensure combined filters (type, category, area, price range, etc.) work together.
	•	Add clear loading states without hiding already-loaded images.
	•	Add "Clear all" that truly resets every filter (client noticed confusion).
	•	QA scenarios list (write them): Sale only, Rent only, both, no type, etc.

2. Home Page Visibility
	•	Ensure newly added properties appear in the correct home sections (Latest, Featured).
	•	Respect the "Featured" toggle from Admin – verify DB flag & query.
	•	Add manual ordering (drag & drop) for Home sections.
	•	Cache/invalidation: confirm ISR/SSG revalidation so new items show without redeploy.

3. Categories Page
	•	✅ Display Category name on each card (overlay/label).
	•	✅ Add cover image per category (upload field in Admin).
	•	✅ Show property count as "X properties" only when >0; otherwise gray/disabled state.
	•	✅ Optional: add small description tooltip or hover state.

4. Popular Areas Section
	•	Populate results when clicking an area (maps to the correct DB field).
	•	Fix shimmer/placeholder that hides loaded thumbnails (remove overlay after load).
	•	Ensure area filter works with type/category filters combined.
	•	Add empty-state message if no listings.

5. Property Creation / Media
	•	Investigate upload failure for second property (network / validation / size limits).
	•	Add explicit image size & aspect ratio hint in the upload UI (e.g., 1200×800 px).
	•	Lightbox/Gallery: use larger images than the inline thumbnails.
	•	Pre-generate responsive sizes (thumbnail, card, lightbox) to improve performance.
	•	Validate featured image presence.

6. Admin UX Improvements
	•	Add tooltips (titles) to action icons in property list (client can't tell what each icon does).
	•	Enable drag & drop sorting inside each Category list.
	•	Add drag & drop for Home page featured order.
	•	Add bulk actions (optional) – publish/unpublish/delete multiple.

7. SEO & Meta Data
	•	Add dynamic meta tags (title, description, OG) for each Property page.
	•	Add meta tags for each Category/Area page (e.g., "Villa for sale in Maadi – 3 floors").
	•	Generate canonical URLs & schema.org (RealEstateListing) where possible.
	•	Create sitemap.xml and update on new property publish.
	•	Robots meta handling for unpublished/draft items.

8. Compare Page Feature
	•	Allow user to select multiple properties (checkbox on cards or "+ Compare" button).
	•	Show comparison table (key attributes side-by-side) on a dedicated page.
	•	Store selections in localStorage or query params.
	•	Clear & share link functionality.

9. QA & Delivery Process
	•	Self-review checklist before sending to client (he requested fewer back-and-forth changes).
	•	Staging environment for client to test changes.
	•	Add monitoring/logging for upload/search errors.

10. Visual / UX Polish
	•	Prevent image flicker by handling skeleton states properly (show skeleton only before load).
	•	Maintain consistent spacing & card heights when data loads.
	•	Improve empty states (no results found, try adjusting filters).
	•	Consider showing category badges on property cards.
	•	Accessibility: Alt text for images, focus states for filters.

⸻

🗂 Implementation Plan (Suggested Order)
	1.	Fix critical bugs: search logic, visibility of new/featured properties, upload failure.
	2.	Data rendering issues: Popular Areas, category labels, skeleton flicker.
	3.	Admin usability: tooltips + drag & drop ordering.
	4.	SEO layer: per-item tags, sitemap, schema.
	5.	Compare feature.
	6.	Polish & QA.

⸻

📏 Definition of Done (per task)
	•	Bug reproduced, root cause documented, fix implemented, and regression tests added.
	•	Cross-browser check (Chrome, Safari, Edge) & mobile responsiveness.
	•	Client scenario re-tested (mirror his exact steps).
	•	Screenshots/video before & after for sign-off.

⸻

📝 Notes / Open Questions
	•	Do we need Arabic & English meta tags for SEO? (bilingual site)
	•	Should category images be mandatory? Provide fallback icon?
	•	Max number of properties in comparison page? (limit to 3–4?)
	•	Any analytics events needed around search/filter usage?

⸻

📊 Progress Summary
- ✅ Completed: 4 tasks (Categories page improvements, category images)
- 🔄 In Progress: 0 tasks
- ⏳ Pending: 26 tasks
- 📈 Overall Progress: ~13% complete

Next step: Confirm priorities & any missing items with Ahmad, then start from section "Top 10 Priorities" and move down.