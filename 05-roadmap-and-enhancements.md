# 05 · Roadmap and Future Enhancements

## Delivery plan by phase

| Phase | Modules | Estimate (dev-days) | Outcome when done |
| --- | --- | --- | --- |
| Phase 0 · Mobile Platform | M00 | 5–6 | Shell, API client, sessions, push/upload/masters plumbing — everything else builds on this |
| Phase 1 · App Foundation | M01, M02, M03, M04, M05 | 11–15 | App opens, gates on version/maintenance, routes to onboarding, login or home |
| Phase 2 · Parent | M06, M07, M08, M09, M10 | 15–17 | Parents sign up, add children and see a dashboard with recommendations and a subscription |
| Phase 3 · Student | M11, M12, M13 | 8–9 | Students sign up (with parental consent under 18) and see their own dashboard/subscription |
| Phase 4 · Teacher | M14, M15, M16, M17, M18, M19, M20 | 23–28 | Teachers register, upload documents, get verified, build a profile and see leads |
| Phase 5 · Institute | M21, M22, M23, M24, M25, M26 | 20–26 | Institutes register, get verified, manage staff and teachers, show ratings |
| Phase 6 · Search & Discovery | M27, M28, M29, M30 | 19–23 | Learners can search, filter, save searches and get personalised recommendations |
| Phase 7 · Profiles | M31, M32, M33 | 12–15 | Full teacher/institute profile pages and shareable links |
| Phase 8 · Reviews | M34, M35, M36 | 8–9 | Reviews with replies and moderation-aware display |
| Phase 9 · Leads | M37, M38, M39 | 13–16 | Leads, messaging and demo bookings end to end |
| Phase 10 · Favourites | M40, M41 | 3–4 | Favourites and comparison |
| Phase 11 · Trust Score | M42 | 3–3 | Trust score explained to every learner and teacher |
| Phase 12 · Payments | M43, M44, M45 | 11–14 | Payments, subscriptions and payment history live |
| Phase 13 · Referrals | M46 | 4–5 | Referral program and wallet |
| Phase 14 · Notifications | M47, M48 | 5–6 | Full push + in-app notification experience |
| Phase 15 · Complaints | M49, M50 | 6–8 | Reporting, blocking and complaint tracking |
| Phase 16 · Settings | M51, M52, M53, M54 | 14–16 | Account, privacy, help and account deletion |

Suggested milestones: **Alpha** (Phases 0–5: foundation, parent, student, teacher, institute onboarding) → **Beta** (Phases 6–11: discovery, profiles, reviews, leads, favourites, trust) → **Launch** (Phases 12–16: payments, referrals, notifications, safety, settings).

## Future enhancements by module

### [M00](modules/M00-mobile-platform-foundation.md) Mobile Platform Foundation

- Certificate pinning (TrustKit / `react-native-ssl-public-key-pinning`) with a backup pin once the API domain is stable.
- Play Integrity API and Apple App Attest tokens on sensitive calls (OTP request, payments) to block emulators and scripted abuse.
- Move analytics to a dedicated pipeline (e.g. PostHog / BigQuery) when event volume passes ~5M/day.
- Partition `user_notifications` by month and archive items older than 12 months.
- Offline-first local database (WatermelonDB) only if a future feature needs heavy offline editing; the query cache is enough for v1.

### [M01](modules/M01-splash-screen.md) Splash Screen

- `app_releases` table (platform, version, notes, rollout %, min OS) for staged rollouts and "What's new" screens.
- Server-driven feature flags per user segment (e.g. GrowthBook) delivered in bootstrap.
- Remote-config onboarding content and seasonal splash artwork.
- Per-city maintenance (e.g. payments down only) using feature flags instead of a global switch.

### [M02](modules/M02-onboarding-screens.md) Onboarding Screens

- Personalise slide order or copy by acquisition channel (e.g. a teacher-focused variant for institute referral links) using the same `onboardingVersion` mechanism, versioned per audience segment.
- A/B test slide copy through a remote-config layer once one exists (see M00 scalability).
- Video or Lottie illustrations instead of static images once bundle size budget (conventions §17, 6 MB) allows it.
- Track `onboarding_slide_viewed` / `onboarding_skipped` analytics events (M00 `POST /events`) to see where users drop off, once the analytics pipeline can slice by slide index.

### [M03](modules/M03-authentication-selection.md) Authentication Selection

- Apple Sign-In alongside Google once the iOS App Store guideline requirement is confirmed to apply (mandatory when any third-party social login is offered).
- WhatsApp OTP as a channel alongside SMS (schema already supports `channel = 'whatsapp'` on `otp_challenges`) if SMS delivery cost or reliability becomes an issue.
- Remember the last successful method per install (`useAppFlags.lastAuthMethod`) and visually promote it to the top on return visits.
- Single Tap / One Tap Google prompt (no button press) for returning Google users, once product wants a more aggressive default.

### [M04](modules/M04-login.md) Login

- Move JWT signing to a KMS-backed key with `kid` rotation and a JWKS endpoint, matching Admin M01's future notes.
- WhatsApp as a third OTP channel (schema-ready, `otp_challenges.channel = 'whatsapp'`) where SMS deliverability is poor.
- Device attestation (Play Integrity / App Attest) gating `/auth/otp/request` and `/auth/google` to cut scripted OTP abuse further than rate limits alone.
- Step-up re-authentication (short-lived "sensitive action" token) before payment method changes or account deletion, instead of relying solely on the 15-minute access token's age.
- Passkeys (WebAuthn) as a fourth identity provider once React Native support is mature enough for a 2 GB RAM Android baseline.

### [M05](modules/M05-registration.md) Registration

- A fifth "I'm not sure" tile that asks two quick questions (age, "do you teach or do you want a teacher?") and recommends a role, for users confused by the four-way choice.
- Server-driven role tile ordering/copy (A/B test "Teacher" vs "Institute" phrasing) once remote config exists.
- Multi-role accounts (e.g. a parent who is also a part-time tutor) — out of scope for v1 ("a user has exactly one role", conventions §4); would need a role-switch flow and a rethink of `app_users.user_type` as the sole role source.
- Save-and-resume by email link ("finish signing up later") for the longer Teacher/Institute forms, instead of relying solely on the on-device encrypted draft.

### [M06](modules/M06-parent-registration.md) Parent Registration

- Optional profile photo at registration once product wants richer parent profiles (currently deferred to M09 Parent Profile, post-registration).
- Auto-detect city from `expo-location` (foreground only) to pre-select the state/city pickers, falling back to the manual pickers exactly as today.
- Multi-language registration form once Hindi strings ship (conventions §2 i18n), reusing the same fields.
- Bulk/import registration for schools onboarding many parents at once (an admin-portal feature, not this app screen) — noted for Admin portal additions if requested later.

### [M07](modules/M07-parent-child-setup.md) Parent Child Setup

- Learning-to-rank recommendations using actual lead/demo outcomes per child, replacing the fixed BR-7.6 weights once M30 has enough signal (module map build-order note: M30 replaces the v0 formula behind the same `rec:<childId>` cache contract, no app change needed).
- A "similar to {childName}" quick-copy when adding a second child with the same class/subjects (common for twins or close-in-age siblings).
- Push the moment a class transition is likely (e.g. April board-year rollover) prompting parents to review each child's class before the new academic year's search results shift under them.
- Per-child content recommendations (blog posts filtered by class, Admin M45) surfaced on the child's card once that module exists.

### [M08](modules/M08-parent-dashboard.md) Parent Dashboard

- Replace the v0 formulas with Module 30's learned scorer without any app change (BR-8.12).
- Precompute rail caches in a nightly/streaming job instead of on first request, to remove the cold-cache latency spike after a child edit.
- A "For You" mixed rail blending teachers and institutes once click-through data exists.
- Per-rail A/B testing of card layout and copy, keyed by `algo_version` (reusing Module 30's column).
- Server-driven layout (rail order and count configurable by admin/segment) once more rail types exist.

### [M09](modules/M09-parent-profile.md) Parent Profile

- Multiple guardians per family (co-parent access) once the product needs it — today one `app_users` row = one parent.
- Address book (multiple saved addresses for different children/schools) if home-tuition logistics need it.
- Profile completeness meter (mirroring the teacher one, Module 17) to nudge photo/area completion, which improves Nearby/Recommended relevance.

### [M10](modules/M10-parent-subscription.md) Parent Subscription

- Family/multi-child plan tiers (e.g. a higher tier unlocking simultaneous demo scheduling for 3+ children).
- In-app plan comparison with usage stats ("You contacted 6 teachers this month").
- Win-back offer screen for `expired`/`cancelled` parents (Admin M30's future coupon codes, Admin M05 §21).
- Re-enable auto-renew from the app once a stored-mandate re-authorisation flow exists (Razorpay recurring token refresh).

### [M11](modules/M11-student-registration.md) Student Registration

- **Schema request:** a `student_subjects` table (mirroring `parent_child_subjects`) to make subject interest durable and editable, replacing the 30-day Redis cold-start hint (BR-11.5).
- **Schema request / v1.1 feature:** a parent-side confirm/decline endpoint and push for a pending account link, removing the current admin-mediated step (BR-11.9).
- A short in-app explainer video for "Why does my parent need to approve?" to raise consent completion rate.
- Email as a fallback parental-consent channel for households where the parent's number can't receive SMS reliably.
- Re-verification of consent if the student's class crosses back below the threshold is not applicable (class only increases), but a periodic re-confirmation (e.g. yearly) could be added if regulation requires it.

### [M12](modules/M12-student-dashboard.md) Student Dashboard

- Fold the cold-start/search-affinity/favourite-category signals into Module 30's proper feature set once it ships, rather than three ad-hoc terms.
- A durable `student_subjects` table (Module 11's schema request) would remove the 30-day cold-start expiry edge case entirely.
- Exam-goal-based rails (e.g. "For JEE Main" curated by admins) once Module 45's blog/content tagging by class extends to subjects.
- Per-rail impression/click analytics feeding Module 30's training data, as Module 8.

### [M13](modules/M13-student-subscription.md) Student Subscription

- Exam-season short plans (e.g. 90-day JEE crash plan) as additional fee codes, per Admin M32 §21.
- A visible "why no trial" state for device-reuse cases if support tickets show it's confusing (currently silent by design, BR-13.3).
- Institutional/school bulk licences that would set many students to `free_access` at once (Admin M32 §21).
- Merge trial-contacts tracking into Module 30's engine so "contacts remaining" also informs recommendation urgency messaging (e.g. nudge to contact a strong match before contacts run out).

### [M14](modules/M14-teacher-registration.md) Teacher Registration

- Server-side draft validation shared with Admin M16's manual-creation form (`FR-16.10`) so both entry points enforce identical rules.
- A "resume by SMS link" flow (deep link straight to `nextStep`) for teachers who abandon the wizard, driven by a reminder job reading `teachers.verification_status = 'draft'` and `created_at` age.
- Bulk-import qualifications from a resume/CV photo via OCR as an optional shortcut before manual entry.
- Category-specific step sets (e.g. institute-affiliated teachers skip Locations) once Module 25 institute-linked teachers are common.

### [M15](modules/M15-teacher-document-upload.md) Teacher Document Upload

- DigiLocker / UIDAI e-KYC integration to skip manual number entry and photo upload entirely (Admin M16 §21 already anticipates this).
- Client-side document-quality pre-check (blur/glare detection) before upload to cut reupload-requested rates.
- Allow a teacher to start verification with only Aadhaar + PAN and add certificates later, once Admin policy supports partial submission.
- Move the OCR/face-match vendor calls (today triggered on submit) to run per-upload for faster feedback, once vendor cost allows it.

### [M16](modules/M16-teacher-verification-status.md) Teacher Verification Status

- Estimated review time shown from a rolling p50 of Admin M16's actual decision times instead of the fixed "24 hours" copy.
- In-app chat with the verification team for edge cases, reusing Module 53's support-ticket infrastructure instead of "Contact support" as a bare link.
- Push-driven live timeline updates via a lightweight WebSocket/SSE channel once polling load becomes noticeable at scale.
- Self-service re-application flow that resets a rejected teacher to `draft` directly from the app (today requires Admin support), once the 30-day rule is stable enough to automate safely.

### [M17](modules/M17-teacher-profile-builder.md) Teacher Profile Builder

- Fee plan templates by category (pre-filled suggestions for "Home Tutor" vs "Coaching Faculty") to speed up setup.
- A/B testing bio prompts or structured bio fields (a short "teaching philosophy" prompt) to lift profile-view-to-lead conversion.
- Multi-photo galleries (classroom photos) once Module 32-style galleries prove valuable for institutes and are extended to teachers.
- Inline "profile score vs. similar teachers in your city" benchmark once Module 21 analytics support percentile comparisons.

### [M18](modules/M18-teacher-dashboard.md) Teacher Dashboard

- City/subject percentile benchmarks ("Top 15% for JEE Physics in Bengaluru") once Admin M21's leaderboard data is safe to expose per-teacher without revealing competitors' identities.
- Push-driven live tile updates for high-value events (a lead just arrived) instead of a 60-second staleTime, via a lightweight event channel.
- Exportable monthly summary (PDF) for a teacher's own records, reusing Module 45's payment-history export patterns.
- A goals feature ("Get to 10 reviews this month") once enough usage data exists to make goals meaningful rather than arbitrary.

### [M19](modules/M19-teacher-availability.md) Teacher Availability

- Per-slot granularity (15/30-minute bookable slots with capacity) instead of open windows, once Module 38 needs finer-grained scheduling than "somewhere in this window."
- Google/Outlook calendar two-way sync so a teacher's external calendar drives availability automatically (Admin M39 §21 already anticipates this on the demo side).
- Recurring time off (e.g. "every Sunday") as a lighter-weight alternative to one-off ranges, if teachers ask for it often enough to justify the added complexity.
- Per-window capacity (a coaching-institute teacher accepting multiple students in the same online slot) once group classes are modelled.

### [M20](modules/M20-teacher-notifications.md) Teacher Notifications

- WhatsApp Business API as a channel for `leads`/`demos` categories once the platform supports it (per Admin M46 §21), reusing the same category/preference model.
- Per-device preferences (mute this specific phone but not a tablet) once multi-device usage is common enough to justify it.
- Smarter default nudging ("Teachers who enable lead push reply 3× faster") shown once during onboarding rather than left to discovery.
- A monthly digest email per category as a lower-frequency alternative to per-event email, once email volume needs it.

### [M21](modules/M21-institute-registration.md) Institute Registration

- GST portal (GSTN public API) lookup during registration to prefill the legal name and address and warn on mismatch.
- Google Places autocomplete for the address with automatic pin placement.
- Branches: a `parent_institute_id` so chains register several centres under one owner account.
- Owner identity through DigiLocker e-KYC instead of an uploaded Aadhaar image.
- Allow one person to belong to several institutes (institute switcher in the app) by moving `iid` from the token into a selected-institute header.
- Admin portal additions: none; registrations appear in Admin M22's queue once submitted, and drafts are visible in the Admin M24 directory with status `draft`.

### [M22](modules/M22-institute-verification.md) Institute Verification

- In-app document scanner with edge detection and automatic crop (ML Kit document scanner on Android, VisionKit on iOS).
- DigiLocker pull for the owner's Aadhaar and PAN instead of images.
- Self-service visit rescheduling with slots published by evaluators.
- Video walkthrough upload (for `video_walkthrough` evaluations) with resumable multipart uploads to R2.
- Admin portal additions: publishing the gallery (Admin M24 FR-24.7) must copy approved `campus_photo` files from `gc-private` to `gc-public` as `institute_gallery` files.

### [M23](modules/M23-institute-dashboard.md) Institute Dashboard

- Partition `institute_profile_views` by month once it passes ~20M rows; move the job to incremental aggregation from an event stream.
- Funnel view (impression → view → enquiry → visit → enrolled) using `demo_requests.outcome`.
- Benchmarks: "Institutes like yours in Koramangala get 22 enquiries a month" from anonymised city/type medians.
- Per-counsellor response metrics once enquiries record which staff member responded.
- CSV export of daily stats for owners.
- Admin portal additions: none; Admin M50 institute reports read `institute_daily_stats`.

### [M24](modules/M24-institute-manager.md) Institute Manager

- Granular per-staff permissions (e.g. a counsellor who can also manage batches) instead of the fixed two roles.
- Staff activity log visible to the manager (last enquiry handled, last sign-in).
- A "meet our team" section on the public profile (photo, designation) sourced from this staff list.
- Branches/chains sharing one staff directory across several institute records (tracked in M21's scalability notes too).
- Bulk facilities/photos import when onboarding a chain of centres.
- Admin portal additions: none; Admin M24 and M25 already cover the same data for support.

### [M25](modules/M25-institute-teacher-management.md) Institute Teacher Management

- An in-app identity check for directly-added (unlinked) institute teachers, instead of relying on the external lightweight flow (Admin M26 FR-26.4) to move them out of `id_pending`.
- Per-batch teacher assignment (which teacher teaches which `institute_batches` row) once batches carry a teacher reference.
- Bulk import (CSV) of a faculty list for onboarding a large institute.
- Teacher-visible history of which institutes have listed them, with an option to unlink themselves.
- Public faculty change history on the profile ("3 new teachers this term").
- Admin portal additions: none; Admin M26 already covers support overrides and the cross-institute phone/teacher search.

### [M26](modules/M26-institute-rating-display.md) Institute Rating Display

- A public "rating history" timeline on the profile (currently staff-only) once ratings are frequent enough to be a positive signal rather than noise.
- Featured/leaderboard rails ("Top-rated JEE coaching in Bengaluru") built on Admin M27's leaderboard endpoint.
- Push a comparison ("your rating vs. similar institutes in your city") using anonymised medians.
- Cache the summary in the CDN edge for the public endpoint once traffic justifies it (currently Redis only).
- Admin portal additions: none; Admin M27 already owns rating creation, submission and the leaderboard.

### [M27](modules/M27-teacher-search.md) Teacher Search

- Move ranking to OpenSearch/Elasticsearch once `teachers` passes ~200k rows and `pg_trgm` scan cost rises; keep the same scoring formula as the relevance function.
- Personalise `relevance` weights per user from click-through (feeds into M30's model rather than duplicating logic here).
- Location-aware suggestions using device GPS instead of area-name text once permission UX is validated.
- Add `subjectIds` multi-select synonyms (e.g. "Maths" ↔ "Mathematics") as a small curated table instead of relying on `aliases` alone.
- Schema requests: GIN trigram indexes on `teachers.full_name` and `subjects.name` (BR-27.2) — no new columns, index-only migration.

### [M28](modules/M28-institute-search.md) Institute Search

- Personalised institute ranking blended with M30's model once enough click-through data exists.
- Distance-based ranking (haversine, like M27) once institute density per city justifies it — today a city-level list is small enough that rating order reads better than distance order.
- Batch-level search ("show only institutes with an open Class 10 CBSE batch starting this month") as a dedicated filter once `institute_batches` volume supports it.

### [M29](modules/M29-advanced-filters.md) Advanced Filters

- Move facet counting to a search index (same migration point as M27's scalability note) so seven grouped counts become sub-100 ms even at high teacher volumes.
- Weekly digest option (in addition to daily) once alert volume data shows daily is too frequent for low-density cities.
- Filter presets ("Budget-friendly", "Highly rated") as one-tap combinations built from the same facet data.
- Cross-target saved searches (one alert covering both teachers and institutes) if usage shows parents want a single combined feed.

### [M30](modules/M30-recommendation-engine.md) Recommendation Engine

- Feed dismissal reasons back into that user's own live scoring (a lightweight per-user category penalty) once enough dismissal volume exists to do so without overfitting on 1–2 data points.
- Replace the in-process candidate SQL with a vector/embedding-based similarity service once subject/category taxonomies grow past what a hand-tuned weighted sum models well.
- A/B testing harness for `recommendations.weights` versions (parallel to Admin M36's trust-weight simulate/activate pattern) rather than a single live version.
- Background pre-warm of the Redis cache for active users overnight, so the first dashboard open of the day never pays the compute-on-miss cost.
- Cross-child household signals (what similar households with a Class 8 CBSE child in the same city responded to) once privacy and volume both support it.

### [M31](modules/M31-teacher-profile-view.md) Teacher Profile View

- Server-rendered, cacheable HTML preview pages per teacher for search-engine indexing beyond the Open Graph share preview (SEO growth channel).
- "Compare teachers" (2–3 side by side) reusing this module's field set once M40/M41 favourites data shows people shortlisting before contacting.
- Video introduction clips on the profile (a new `files` purpose) once upload/transcoding infrastructure exists.
- Personalised "why this teacher" reasons (reused from M30) surfaced directly on the profile hero, not only in rails.

### [M32](modules/M32-institute-profile-view.md) Institute Profile View

- Server-rendered, indexable HTML preview pages per institute for SEO, matching M31's equivalent note.
- "Compare institutes" side by side once favourites/shortlisting data (M41) shows demand.
- Virtual campus tour (360° photos or short video) on the gallery once upload infrastructure supports larger media.
- Batch waitlist ("Notify me when a seat opens") tied into M39's enquiry flow instead of only a generic enquiry message.

### [M33](modules/M33-profile-sharing.md) Profile Sharing

- Deferred deep linking (e.g. Branch.io-style) so a store install truly resumes into the exact shared profile even without a referral code round trip, rather than relying on BR-33.4's registration-time join.
- Per-share analytics (which channel converts best) once volume justifies a breakdown beyond the two counters.
- QR codes for offline sharing (a teacher's visiting card, an institute's front-desk poster) generated from the same short codes.
- Expiring or one-time share links for time-limited promotions, as a `expires_at` column addition if ever needed.

### [M34](modules/M34-teacher-reviews.md) Teacher Reviews

- Aspect ratings for teachers (clarity, punctuality, patience) using a new `teacher_reviews.aspect_ratings` jsonb, mirroring institute reviews.
- "Helpful" votes and sort by helpfulness (needs a `review_votes` table).
- Photo attachments on reviews (homework improvement, report cards with names blurred) through M00 uploads and moderation.
- Hindi and regional-language reviews with on-device translation toggle.
- Report outcome notifications to reporters once Admin M35 records a user-facing outcome message.
- Admin portal additions: none — Admin M33/M35 cover reviews, reports and moderation.

### [M35](modules/M35-institute-reviews.md) Institute Reviews

- Batch-level reviews (review a specific `institute_batches` row) once institutes run many batches.
- Verified-result badges ("Student cleared JEE Main 2026") with document proof.
- Reply templates saved per institute.
- Response-time metric for replies shown on the institute profile.
- Admin portal additions: none — Admin M34/M35 cover institute reviews and reply moderation.

### [M36](modules/M36-teacher-reply-to-review.md) Teacher Reply To Review

- AI-assisted reply suggestions (tone check before posting) running server-side with the same moderation rules.
- Private message to the reviewer from a review (needs a lead/message link for reviews without a lead).
- Reply-rate badge on the public profile ("Replies to 90 % of reviews").
- Admin portal additions: none — reply moderation is in Admin M35.

### [M37](modules/M37-contact-teacher.md) Contact Teacher

- Real-time delivery over WebSockets or SSE (`/leads/stream`) to replace 5-second polling when active threads exceed ~20k.
- Image and PDF attachments in messages (syllabus, fee receipts) through M00 uploads with contact-info OCR.
- Call recording and call-outcome logging from the masked-calling provider (needs a `lead_calls` table).
- Smart replies for teachers ("Share fee details", "Propose demo time").
- Partition `lead_messages` by month after ~50M rows.
- Admin portal additions: a read-only "Messages" tab on the Admin M38 lead detail (with `users.pii` masking and flagged messages highlighted), a queue of flagged messages and contact-info detections, and settings UI for `calls.masked_enabled` and the telephony provider.

### [M38](modules/M38-demo-class-request.md) Demo Class Request

- Teacher-side bulk slot templates ("copy this week to the next 4 weeks") — already served by M19, referenced here for context.
- In-app video for the demo itself, replacing external meeting links (needs a `demo_sessions` table and a WebRTC/SFU provider).
- Institute per-counsellor calendars with real slot picking, once campus-visit volume justifies it.
- Automatic rebooking suggestion when a demo expires or is cancelled (reuse the M30 recommendation engine).
- Waitlist for a fully booked teacher's next opening.
- Admin portal additions: none — Admin M39 already covers demo scheduling, cancellation, rescheduling and outcome for support.

### [M39](modules/M39-contact-institute.md) Contact Institute

- Round-robin or load-based auto-assignment across active counsellors once enquiry volume per institute justifies it.
- A dedicated "team" view showing every staff member's open count and response time, feeding a lightweight institute-side leaderboard.
- SMS fallback for institute staff exactly as M37's teacher SMS nudge, once institute response rates lag behind teachers'.
- Admin portal additions: none — Admin M38 already shows institute leads and their assignment in the lead detail's target card.

### [M40](modules/M40-favorite-teachers.md) Favorite Teachers

- Shareable favourite lists ("Teachers I'm considering for Aarav") a parent can send to a co-parent or grandparent, read-only.
- Price-drop or new-fee-plan alerts specifically for favourited teachers, beyond the generic update notification.
- A "Compare my favourites" shortcut straight into M29's advanced filters/compare view once favourites exceed 5.
- Admin portal additions: none — favourites are private, personal data with no admin-facing use in v1.

### [M41](modules/M41-favorite-institutes.md) Favorite Institutes

- A saved "Shortlist" note per compare session, so a parent can pick up a comparison later without reselecting.
- Comparison across teachers and institutes together once a family is deciding between a private tutor and a coaching centre for the same subject.
- Share a comparison (read-only link) with a co-parent, reusing M33's profile-sharing short codes.
- Admin portal additions: none — favourites and comparisons are private, personal data with no admin-facing use in v1.

### [M42](modules/M42-trust-score-display.md) Trust Score Display

- A "what changed since last week" push summarising the biggest single mover, once teachers ask for more proactive updates than the raw history screen gives.
- Per-category weight visibility for parents (e.g. showing that Reviews outweighs Profile completion) if user research shows it builds more trust than the current four-line summary.
- Comparable trust-score context on `CompareInstitutes`-style teacher comparison, once teacher-to-teacher compare ships.
- Localised (Hindi) plain-language sentences alongside the rest of the app's i18n rollout.
- Admin portal additions: none — Admin M36/M37 already own every write and every admin-facing view of trust scores and their history.

### [M43](modules/M43-payment-gateway.md) Payment Gateway

- Razorpay Turbo UPI (in-app UPI without app switch) once available for the account, cutting drop-off on UPI intent.
- Second gateway (Cashfree / PhonePe PG) behind the `PaymentGateway` interface with automatic failover when Razorpay's order API errors.
- Promo codes as a second discount line in `PriceBreakdownCard` (Admin M05 future coupons), stored in `discount_paise` with `metadata.promoCode`.
- Play Integrity / App Attest token on `POST /payments/orders` to block scripted order creation.
- Saved UPI IDs / tokenised cards via Razorpay Customer and Tokens APIs for one-tap renewals.

### [M44](modules/M44-subscriptions.md) Subscriptions

- Plan upgrades with pro-rated credit (monthly → yearly immediately) instead of queuing.
- AutoPay for teacher registration and boosts once UPI Autopay limits and demand justify it.
- City-level featured slot waitlist with automatic purchase offer when a slot opens.
- Family membership shared between two guardians (Admin M41 future note).
- Schema request: `payment_configurations.gateway_plan_id` to replace the Redis plan-id cache (BR-44.4).
- Admin portal additions: a "Mandates" tab in the Admin M41 subscription drawer showing Razorpay subscription status, charge attempts and a cancel-mandate button.

### [M45](modules/M45-payment-history.md) Payment History

- Partial-amount refund requests (currently full refundable amount only) once support needs finer control from the app side.
- Bulk export (CSV/PDF) of a date range for a teacher's or institute's annual tax filing.
- In-app support chat pre-filled from a payment instead of a plain ticket link.
- Push the refund decision the moment Admin M40's webhook lands, instead of relying on the next `GET /payments/:id` (already covered by BR-45's push table; today the app also refetches on foreground).
- A combined annual GST statement (all invoices for a financial year in one PDF) once teachers ask for it at tax time.

### [M46](modules/M46-referral-system.md) Referral System

- Wallet credit expiry after a configurable number of days (no expiry at launch; `wallet_ledger.expires_at` is already in the schema for this).
- Tiered rewards (a bigger reward after 5 successful referrals) once Admin M42 ships tiered rules.
- A referral leaderboard visible to users themselves (today `GET /referrals/top-referrers` is admin-only), as a light gamification layer.
- Share-link attribution with per-channel tracking (WhatsApp vs SMS vs copy-link conversion) beyond the existing `profile_shares` table (M33).
- `reward_type = discount` programs applying the referee's reward automatically at their first `PaymentSheet` checkout instead of (or in addition to) a wallet credit.

### [M47](modules/M47-push-notifications.md) Push Notifications

- Rich push (images, action buttons — "Reply" inline for `lead_message`) once FCM's data payload size and Notifee's action-button support are worth the added complexity.
- Per-user send-time optimisation (send within quiet hours' end at the time historically most opened) instead of a fixed 08:00 for delayed non-urgent pushes.
- Consolidate near-duplicate events into one send when several fire within a short window for the same user (e.g. two leads within a minute), to reduce notification fatigue.
- A dedicated events service (outside the shared Express/BullMQ stack) once push volume passes a few million sends/day.
- SMS/WhatsApp fallback for `urgent` categories when a user has no active device and push has failed twice running.
- Retire the pre-convention event names (BR-47.3) in a single migration once all clients on old dedupe-key formats have aged out (30-day `user_notifications` lookback is enough to confirm).

### [M48](modules/M48-notification-center.md) Notification Center

- Inline notification grouping ("3 new leads" collapsing several `lead_new` rows from the same day) once volume makes a flat list noisy.
- A quick "Mute this category" action right from a row's swipe menu, deep-linking into M20's preference switches instead of a separate settings trip.
- Search within notifications once the list is long enough to need it (title/body full-text).
- Rich campaign layouts (carousel, video) for `announcements` rows, matching whatever Admin M46 adds to campaign composition.
- Move `user_notifications` to a partitioned table (by month) once the 12-month retention job is deleting a meaningful fraction of total rows nightly (M00's existing scalability note).

### [M49](modules/M49-report-user.md) Report User

- In-app two-way messaging on an open case (currently only via the resolve/dismiss message and info requests) — tracked as an Admin M43 scalability item too.
- Automatic detection of payment-outside-app language in lead messages to pre-fill a report (shared with M37's contact-info detector).
- A short "why block" taxonomy (harassment, spam, inappropriate) instead of free text, to feed abuse analytics.
- Rate-limit reports per (reporter, reported) pair specifically, not just per reporter, once report volume grows.
- Bulk "block and report" from a single sheet for institute counsellors handling many enquiries.

### [M50](modules/M50-complaint-history.md) Complaint History

- Push a small "days since last update" indicator on long-open cases so users don't feel forgotten (paired with Admin M43's SLA breach view).
- Read receipts on info requests so support knows the user has seen the question before the 7-day auto-transition.
- A "was this outcome fair?" one-tap feedback on resolved cases, separate from the app-store rating prompt.

### [M51](modules/M51-account-settings.md) Account Settings

- Apple Sign-In as a second social provider once iOS volume justifies it.
- Passkeys (WebAuthn) as a phishing-resistant alternative to password.
- Step-up re-authentication (fresh OTP) before especially sensitive actions like unlinking the only backup identity.
- Session naming ("iPhone 14 · Bengaluru") using IP geolocation, shown next to the device model.
- Email change confirmation on both old and new addresses (currently only the new one is OTP-verified) once email deliverability is proven reliable.

### [M52](modules/M52-privacy-settings.md) Privacy Settings

- A dedicated `data_export_requests` table once export volume needs a status/history UI beyond "one request every 30 days".
- Granular per-teacher visibility (hide my activity from a specific teacher) beyond the global search-visibility toggle.
- Consent captured per-language document version, so re-consent prompts show the policy in the user's own language.
- Automated DPDP grievance-officer routing for data-principal requests beyond export (correction, erasure — erasure already lives in M54).

### [M53](modules/M53-help-support.md) Help & Support

- In-app live chat for `technical`/`account` categories during support hours, falling back to async tickets outside them.
- Suggested FAQs ranked by the user's own recent activity (e.g. a failed payment surfaces the refund FAQ first).
- CSAT trend dashboard from `support_tickets.rating` (Admin side).
- Canned replies and macros for support agents (Admin side).
- Admin portal additions: a Support Tickets queue (list, filters by category/priority/status, assignment, SLA-style first-response tracking, reply composer with saved macros, rating dashboard) — `support_tickets`/`support_ticket_messages` have no admin screens in the Admin SRS pack today; this module's data model is ready for them.

### [M54](modules/M54-delete-account.md) Delete Account

- A shorter, opt-in immediate-erasure path once legal confirms it's safe for accounts with zero financial/safety history.
- Self-serve "why was I blocked" deep links directly into resolving each blocker (e.g. one-tap to view the exact referral reward, not just its date).
- Bulk/GDPR-style data processor notifications if GuruConnect adds EU users, alongside the DPDP-only flow today.
- A support-side "deletion audit" screen reading `erasure_report` for compliance responses, without exposing any personal data that was already scrubbed.

## Platform-wide

- Certificate pinning and Play Integrity / App Attest on sensitive calls (OTP, payments).
- Offline-first local database (WatermelonDB) if a future feature needs heavy offline editing beyond the query cache.
- Hindi and regional-language UI (strings are already externalised in `i18n/`).
- In-app video/voice calling for demos and lead conversations.
- Partition high-volume tables by month (`user_notifications`, `user_search_history`, `notification_recipients`, `recommendation_impressions`).
