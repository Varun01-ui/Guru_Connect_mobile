# 02 · API Index

All 240 mobile app endpoints. Base URL `https://api.guruconnect.in/api/v1/app` unless noted. Auth values: **Public** (no token), **Registration token**, **Any user**, or a specific role. Envelope, headers, pagination, idempotency and error codes are in `00-conventions.md` §5.

## Phase 0 · Mobile Platform

### [M00](modules/M00-mobile-platform-foundation.md) Mobile Platform Foundation

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/me` | Any user | Account summary, role, profile id, flags, unread count |
| PUT | `/devices/me` | Any user | Register or update this install's device and FCM token |
| DELETE | `/devices/me` | Any user | Revoke this install's device (sign-out) |
| POST | `/uploads/presign` | Any user (and Registration token for registration uploads) | Create a pending file and presigned R2 PUT URL |
| POST | `/uploads/:fileId/confirm` | Any user | Verify the uploaded object and activate the file |
| GET | `/files/:id/url` | Any user (owner only) | 60-second presigned GET for a private file |
| GET | `/masters` | Public | Classes, subjects, boards, modes, categories, states, cities (ETag) |
| GET | `/masters/areas` | Public | Areas of a city (`?cityId=`) |
| POST | `/events` | Public (install) / Any user | Batched analytics and impression events |

## Phase 1 · App Foundation

### [M01](modules/M01-splash-screen.md) Splash Screen

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/bootstrap` | Public | Versions, maintenance, store URLs, onboarding version, login methods, flags, public limits, masters version, server time |

### [M02](modules/M02-onboarding-screens.md) Onboarding Screens

| Method | Path | Auth | Description |
| --- | --- | --- | --- |

### [M03](modules/M03-authentication-selection.md) Authentication Selection

| Method | Path | Auth | Description |
| --- | --- | --- | --- |

### [M04](modules/M04-login.md) Login

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/otp/request` | Public | Send a phone OTP (rate limited: 5/hour/phone, 30 s resend) |
| POST | `/auth/otp/verify` | Public | Verify a phone or email OTP; logs in, or returns a registrationToken |
| POST | `/auth/email/login` | Public | Email + password sign-in (rate limited: 8/min per IP+email) |
| POST | `/auth/email/otp/request` | Public | Send an email OTP for passwordless sign-in (same limits as phone) |
| POST | `/auth/password/forgot` | Public | Send a password-reset OTP by email (never confirms account existence) |
| POST | `/auth/password/reset` | Public | Verify the reset OTP and set a new password; revokes all sessions |
| POST | `/auth/google` | Public | Google ID-token sign-in, with auto-link and auto-registration handoff |
| POST | `/auth/refresh` | Public (refresh token) | Rotate the refresh token; detects and punishes reuse |
| POST | `/auth/logout` | Any user | Revoke the current session |
| POST | `/auth/logout-all` | Any user | Revoke every session of this account |
| GET | `/auth/sessions` | Any user | List this account's active sessions |
| DELETE | `/auth/sessions/:id` | Any user (owner only) | Revoke one session by id |

### [M05](modules/M05-registration.md) Registration

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/registration/context` | Registration token | Verified contact, prefill, legal versions, pending referral hint |
| POST | `/registration/referral/validate` | Registration token | Check a code without applying it (Idempotency-Key not needed — read-only) |

## Phase 2 · Parent

### [M06](modules/M06-parent-registration.md) Parent Registration

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/registration/parent` | Registration token | Create the parent account, identities and session in one transaction (Idempotency-Key) |

### [M07](modules/M07-parent-child-setup.md) Parent Child Setup

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/parent/children` | Parent | List this parent's children |
| POST | `/parent/children` | Parent | Add a child; triggers recompute and returns a top-3 preview (Idempotency-Key) |
| PATCH | `/parent/children/:id` | Parent (owner only, If-Match) | Edit a child; re-triggers recompute on a qualifying field change |
| DELETE | `/parent/children/:id` | Parent (owner only) | Remove a child (soft) |
| PUT | `/parent/children/order` | Parent | Reorder the child switcher |

### [M08](modules/M08-parent-dashboard.md) Parent Dashboard

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/home/parent` | Parent | Children, banners and five rails (`?childId=&rail=&cursor=&limit=`) |

### [M09](modules/M09-parent-profile.md) Parent Profile

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/parent/profile` | Parent | Own profile and summary counts |
| PATCH | `/parent/profile` | Parent | Update name, photo, city/area (If-Match) |

### [M10](modules/M10-parent-subscription.md) Parent Subscription

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/plans` | Any user | Active plans for the caller's role (`?role=parent`) |
| GET | `/subscriptions/current` | Any user | Caller's current/most recent subscription (`?role=parent`) |
| POST | `/subscriptions/:id/auto-renew` | Any user (owner) | Turn auto-renew off |
| POST | `/subscriptions/:id/cancel` | Any user (owner) | Cancel now or at period end |

## Phase 3 · Student

### [M11](modules/M11-student-registration.md) Student Registration

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/registration/student` | Registration token | Create the student account (Idempotency-Key = the registration token's `jti`) |
| POST | `/student/parent-consent/request` | Student | Resend the parental consent OTP |
| POST | `/student/parent-consent/verify` | Student | Verify the parent's OTP and confirm consent |

### [M12](modules/M12-student-dashboard.md) Student Dashboard

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/home/student` | Student | Banners and five rails (`?rail=&cursor=&limit=`) |

### [M13](modules/M13-student-subscription.md) Student Subscription

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/plans` | Any user | Active plans for the caller's role (`?role=student`) |
| GET | `/subscriptions/current` | Any user | Caller's current/most recent subscription, or `covered_by_parent` (`?role=student`) |
| POST | `/subscriptions/:id/auto-renew` | Any user (owner) | Turn auto-renew off |
| POST | `/subscriptions/:id/cancel` | Any user (owner) | Cancel now or at period end |

## Phase 4 · Teacher

### [M14](modules/M14-teacher-registration.md) Teacher Registration

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/registration/teacher` | Registration token | Create the app_users + teachers draft, issue session (Idempotency-Key) |
| GET | `/teacher/registration` | Teacher | Current draft, completed steps, nextStep |
| PATCH | `/teacher/registration/basics` | Teacher | Update personal-details or experience fields (If-Match) |
| POST | `/teacher/qualifications` | Teacher | Add a qualification |
| PATCH | `/teacher/qualifications/:id` | Teacher | Edit a qualification |
| DELETE | `/teacher/qualifications/:id` | Teacher | Remove a qualification |
| PUT | `/teacher/subjects` | Teacher | Replace the subject set |
| PUT | `/teacher/classes` | Teacher | Replace the class set |
| PUT | `/teacher/teaching-modes` | Teacher | Replace the teaching-mode set |
| PUT | `/teacher/locations` | Teacher | Replace the location set |

### [M15](modules/M15-teacher-document-upload.md) Teacher Document Upload

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/teacher/documents` | Teacher | Current documents per type, readiness for submit |
| POST | `/teacher/documents` | Teacher | Add or replace the current document of a type (Idempotency-Key) |
| DELETE | `/teacher/documents/:id` | Teacher | Remove a multi-slot document (draft only) |
| POST | `/teacher/registration/submit` | Teacher | Submit for verification (Idempotency-Key) |

### [M16](modules/M16-teacher-verification-status.md) Teacher Verification Status

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/teacher/verification` | Teacher | Mapped status, document checklist, timeline |
| POST | `/teacher/verification/resubmit` | Teacher | Return a reupload_requested application to the queue |

### [M17](modules/M17-teacher-profile-builder.md) Teacher Profile Builder

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/teacher/profile` | Teacher | Full profile, completeness checklist, fee plans |
| PATCH | `/teacher/profile` | Teacher | Edit About/Experience fields (If-Match) |
| GET | `/teacher/profile/preview` | Teacher | Public-shaped preview |
| GET | `/teacher/fee-plans` | Teacher | List active fee plans |
| POST | `/teacher/fee-plans` | Teacher | Add a fee plan |
| PATCH | `/teacher/fee-plans/:id` | Teacher | Edit a fee plan |
| DELETE | `/teacher/fee-plans/:id` | Teacher | Remove a fee plan |

### [M18](modules/M18-teacher-dashboard.md) Teacher Dashboard

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/teacher/dashboard` | Teacher | KPIs, trust score, completeness, unanswered leads, recent activity |

### [M19](modules/M19-teacher-availability.md) Teacher Availability

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/teacher/availability` | Teacher | Weekly windows + time-off ranges |
| PUT | `/teacher/availability` | Teacher | Replace the weekly window set |
| GET | `/teacher/time-off` | Teacher | List time-off ranges |
| POST | `/teacher/time-off` | Teacher | Add a time-off range (Idempotency-Key) |
| DELETE | `/teacher/time-off/:id` | Teacher | Remove a time-off range early |

### [M20](modules/M20-teacher-notifications.md) Teacher Notifications

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/notification-preferences` | Any user | Current per-category push/email settings |
| PUT | `/notification-preferences` | Any user | Update one or more categories |

## Phase 5 · Institute

### [M21](modules/M21-institute-registration.md) Institute Registration

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/registration/institute` | Registration token | `mode = owner`: create owner account + draft institute + primary manager in one transaction; `mode = join`: accept a staff invite. Returns session tokens (Idempotency-Key). 5/hour per install |
| PATCH | `/institute/registration/basics` | Institute staff (manager) | Edit registration details while `draft`, `docs_requested` or re-applying after rejection (If-Match). 30/hour |

### [M22](modules/M22-institute-verification.md) Institute Verification

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/institute/verification` | Institute staff | Status, stepper, checklist summary, fee, visit/rejection details, first 20 timeline entries (`?timelineCursor=` for more) |
| GET | `/institute/documents` | Institute staff (manager) | Current documents per slot with the last 2 versions and review notes |
| POST | `/institute/documents` | Institute staff (manager) | Link an uploaded file as a new document or version (Idempotency-Key). 30/day per institute |
| DELETE | `/institute/documents/:id` | Institute staff (manager) | Delete an unreviewed current document; previous version becomes current |
| POST | `/institute/registration/submit` | Institute staff (manager) | Submit or resubmit for review (Idempotency-Key); idempotent when already pending |

### [M23](modules/M23-institute-dashboard.md) Institute Dashboard

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/institute/dashboard` | Institute staff | Dashboard for the caller's institute and role (`?range=7d |

### [M24](modules/M24-institute-manager.md) Institute Manager

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/institute/staff` | Institute staff | Team directory for the caller's institute |
| POST | `/institute/staff/invite` | Institute staff (manager) | Invite (or resend to) a phone number as manager or counsellor. 10/hour |
| PATCH | `/institute/staff/:id` | Institute staff (manager) | Edit designation/role (If-Match) |
| DELETE | `/institute/staff/:id` | Institute staff (manager) | Disable a staff account with a reason |
| GET | `/institute/profile` | Institute staff | Full editable profile |
| PATCH | `/institute/profile` | Institute staff (manager) | Edit the profile (If-Match); starred fields need a reason |
| GET | `/institute/batches` | Institute staff | List of batches |
| POST | `/institute/batches` | Institute staff (manager) | Add a batch |
| PATCH | `/institute/batches/:id` | Institute staff (manager) | Edit a batch (If-Match) |
| DELETE | `/institute/batches/:id` | Institute staff (manager) | Soft-delete a batch |

### [M25](modules/M25-institute-teacher-management.md) Institute Teacher Management

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/institute/teachers` | Institute staff | Faculty list with counts and limit |
| POST | `/institute/teachers` | Institute staff (manager) | Add a teacher. 20/day |
| PATCH | `/institute/teachers/:id` | Institute staff (manager) | Edit fields and/or reassign subjects/classes (If-Match) |
| DELETE | `/institute/teachers/:id` | Institute staff (manager) | Remove (soft) with an optional reason |
| POST | `/institute/teachers/link` | Institute staff (manager) | Request a link to an approved GuruConnect teacher by code. 10/day |
| GET | `/teacher/institute-invites` | Teacher | Pending link requests for the caller |
| POST | `/teacher/institute-invites/:id/accept` | Teacher | Accept — sets `teacher_id`, `status = active` |
| POST | `/teacher/institute-invites/:id/decline` | Teacher | Decline — cancels the request, no table change |

### [M26](modules/M26-institute-rating-display.md) Institute Rating Display

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/institutes/:id/rating` | Any user (public, limited for signed-out) | Public rating summary, user review average, up to 3 recent reviews |
| GET | `/institute/rating` | Institute staff | Same summary for the caller's own institute, plus next review date and history |

## Phase 6 · Search & Discovery

### [M27](modules/M27-teacher-search.md) Teacher Search

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/search/teachers` | Learner (browse limited for Public — city required, no trust/rating filters, results capped at page 1) | Ranked, paged teacher results. 120/min per user |
| GET | `/search/suggestions` | Any user / Public | Autocomplete for the search bar (`target=teacher\ |
| GET | `/search/history` | Learner | Last 10 recent searches |
| DELETE | `/search/history` | Learner | Clear all recent searches |
| DELETE | `/search/history/:id` | Learner | Delete one recent search |
| POST | `/search/history/:id/click` | Learner | Record which result was opened from that search (best-effort) |

### [M28](modules/M28-institute-search.md) Institute Search

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/search/institutes` | Learner (Public browse: cityId required, page 1 only) | Ranked, paged institute results. 120/min per user |

### [M29](modules/M29-advanced-filters.md) Advanced Filters

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/search/filters` | Learner | Full option lists with live facet counts for the current draft filters and target |
| GET | `/saved-searches` | Learner | List the caller's saved searches |
| POST | `/saved-searches` | Learner | Save a named filter set (Idempotency-Key). Max 10 per user |
| PATCH | `/saved-searches/:id` | Learner | Rename, update filters, or toggle alert (If-Match) |
| DELETE | `/saved-searches/:id` | Learner | Remove a saved search |

### [M30](modules/M30-recommendation-engine.md) Recommendation Engine

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/recommendations` | Learner | One named rail for the caller (and child, if a parent), paged |
| POST | `/recommendations/dismiss` | Learner | Mark a teacher or institute "Not interested" for a child/account (Idempotency-Key) |
| DELETE | `/recommendations/dismiss/:id` | Learner | Undo a dismissal |

## Phase 7 · Profiles

### [M31](modules/M31-teacher-profile-view.md) Teacher Profile View

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/teachers/:idOrCode` | Learner (full), Public (limited, BR-31.3) | Teacher profile |
| GET | `/teachers/:id/similar` | Learner, Public (limited fields) | Up to 8 similar teachers |

### [M32](modules/M32-institute-profile-view.md) Institute Profile View

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/institutes/:idOrSlug` | Learner (full), Public (limited, BR-32.5) | Institute profile |
| GET | `/institutes/:id/teachers` | Learner | Listed, visible active teachers |
| GET | `/institutes/:id/batches` | Learner | Active batches, optional class/subject filter |

### [M33](modules/M33-profile-sharing.md) Profile Sharing

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/shares` | Any user | Create a short share link for a teacher or institute profile (Idempotency-Key). 30/hour per user |
| GET | `/shares/:code` | Public | Resolve a short code: crawler preview, app deep link, or web landing page |
| GET | `/shares/me` | Any user | The caller's own share history |

## Phase 8 · Reviews

### [M34](modules/M34-teacher-reviews.md) Teacher Reviews

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/teachers/:id/reviews` | Any user | Summary + published reviews (cursor), `sort`, `rating`, `withReply`; `data.mine` for the viewer |
| GET | `/teachers/:id/reviews/eligibility` | Learner | Can the user review this teacher, why not, existing review id, `eligibleFrom` |
| POST | `/teachers/:id/reviews` | Learner | Create a review (Idempotency-Key). 5/hour per user |
| PATCH | `/reviews/:id` | Learner (author) | Edit within the window (If-Match); back to pending |
| DELETE | `/reviews/:id` | Learner (author) | Soft-delete own review |
| POST | `/reviews/:id/report` | Learner, Teacher | Report a teacher review (Idempotency-Key). 10/day per user |
| GET | `/me/reviews` | Learner | Reviews the user wrote (teacher + institute), with status and edit window |

### [M35](modules/M35-institute-reviews.md) Institute Reviews

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/institutes/:id/reviews` | Any user | Summary with aspect averages + published reviews (cursor); `data.mine` |
| GET | `/institutes/:id/reviews/eligibility` | Learner | Eligibility, reason, `eligibleFrom`, existing review id |
| POST | `/institutes/:id/reviews` | Learner | Create (Idempotency-Key). 5/hour per user |
| PATCH | `/institute-reviews/:id` | Learner (author) | Edit within the window (If-Match) |
| DELETE | `/institute-reviews/:id` | Learner (author) | Soft-delete own review |
| POST | `/institute-reviews/:id/report` | Learner, Institute staff | Report a review (Idempotency-Key). 10/day |
| GET | `/institute/reviews` | Institute staff | Own institute's published/flagged reviews with reply state and summary |
| POST | `/institute/reviews/:id/reply` | Institute staff | Create or replace the institute's reply (goes to moderation) |
| DELETE | `/institute/reviews/:id/reply` | Institute staff | Delete the institute's reply |

### [M36](modules/M36-teacher-reply-to-review.md) Teacher Reply To Review

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/teacher/reviews` | Teacher | Published/flagged reviews on my profile, summary, filters (cursor) |
| PUT | `/teacher/reviews/:id/reply` | Teacher | Create or replace my reply; goes to moderation. 10 saves/review/day |
| DELETE | `/teacher/reviews/:id/reply` | Teacher | Delete my reply |

## Phase 9 · Leads

### [M37](modules/M37-contact-teacher.md) Contact Teacher

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/leads` | Learner | Create an inquiry or call-back lead (Idempotency-Key); `targetType` teacher or institute (M39). 3/min, daily limit |
| GET | `/leads` | Learner | My requests (cursor); `status=open |
| GET | `/leads/:id` | Learner, Teacher, Institute staff | Lead detail for either side; receiver's first read sets `viewed` |
| PATCH | `/leads/:id/status` | Learner | Requester closes or marks classes started |
| POST | `/leads/:id/unlock-contact` | Learner | Unlock with plan entitlement, or get pay-per-contact options (402) |
| POST | `/leads/:id/call-intent` | Learner, Teacher, Institute staff | Direct number, masked bridge or WhatsApp link; teacher call marks contacted. 10/lead/hour |
| GET | `/leads/:id/messages` | Learner, Teacher, Institute staff | Thread (`after` / `before` cursors, 50 per page) |
| POST | `/leads/:id/messages` | Learner, Teacher, Institute staff | Send a message (idempotent by `clientMessageId`). 20/min |
| POST | `/leads/:id/messages/read` | Learner, Teacher, Institute staff | Mark the other side's messages read up to an id |
| DELETE | `/leads/:id/messages/:messageId` | Learner, Teacher, Institute staff | Sender deletes within 10 minutes |
| POST | `/leads/:id/messages/:messageId/report` | Learner, Teacher, Institute staff | Flag a received message; returns M49 report prefill |
| GET | `/teacher/leads` | Teacher | Lead inbox (`tab=new |
| PATCH | `/teacher/leads/:id/status` | Teacher | Contacted / converted / declined (If-Match) |

### [M38](modules/M38-demo-class-request.md) Demo Class Request

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/teachers/:id/demo-slots` | Learner | Available slots for the next 21 days, grouped by date |
| POST | `/demos` | Learner | Book a demo or campus visit (Idempotency-Key); creates the lead |
| GET | `/demos` | Learner, Teacher, Institute staff | My demos (cursor), `tab=upcoming |
| GET | `/demos/:id` | Learner, Teacher, Institute staff | Detail for either side |
| POST | `/demos/:id/confirm` | Teacher, Institute staff | Confirm the slot (or a new one) |
| POST | `/demos/:id/reschedule` | Learner, Teacher, Institute staff | Propose a new slot |
| POST | `/demos/:id/accept-reschedule` | Learner, Teacher, Institute staff | Accept the other side's proposed slot |
| POST | `/demos/:id/cancel` | Learner, Teacher, Institute staff | Cancel with a reason |
| POST | `/demos/:id/complete` | Learner, Teacher, Institute staff | Mark completed |
| POST | `/demos/:id/no-show` | Learner, Teacher, Institute staff | Report the other side's no-show |
| POST | `/demos/:id/outcome` | Learner, Teacher, Institute staff | Record enrolled / not enrolled / undecided (first submission wins) |

### [M39](modules/M39-contact-institute.md) Contact Institute

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/institute/enquiries` | Institute staff | Inbox with filters and tab counts (cursor) |
| GET | `/institute/enquiries/:id` | Institute staff | Detail: lead + assigned teacher + linked campus visit |
| PATCH | `/institute/enquiries/:id` | Institute staff | Assign to a teacher and/or correct status (If-Match) |

## Phase 10 · Favourites

### [M40](modules/M40-favorite-teachers.md) Favorite Teachers

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/favorites` | Learner | List (cursor), `targetType`, `childId`, `sort` |
| POST | `/favorites` | Learner | Add a favourite (Idempotency-Key); idempotent on repeat |
| DELETE | `/favorites/:id` | Learner | Remove (idempotent) |
| PATCH | `/favorites/:id` | Learner | Update the child tag and/or note |

### [M41](modules/M41-favorite-institutes.md) Favorite Institutes

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/favorites?targetType=institute` | Learner | Reused from M40 |
| POST | `/favorites` | Learner | Reused from M40 (`targetType: "institute"`) |
| PATCH | `/favorites/:id` | Learner | Reused from M40 |
| DELETE | `/favorites/:id` | Learner | Reused from M40 |
| GET | `/favorites/institutes/compare` | Learner | Side-by-side of 2–3 saved institutes |

## Phase 11 · Trust Score

### [M42](modules/M42-trust-score-display.md) Trust Score Display

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/teachers/:id/trust-score` | Any user | Public score, band and the four grouped categories with plain-language lines |
| GET | `/teacher/trust-score` | Teacher | Own full six-factor breakdown, tips, and frozen/override banner |
| GET | `/teacher/trust-score/history` | Teacher | Own score series and a de-identified event timeline |

## Phase 12 · Payments

### [M43](modules/M43-payment-gateway.md) Payment Gateway

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/payments/quote` | Any user | Price, GST split, wallet redemption and period for a fee code (`?feeCode=&useWallet=&leadId=&renewal=`) |
| POST | `/payments/orders` | Any user | Create transaction + Razorpay order and return checkout options (Idempotency-Key). 10/min, 30/hour |
| POST | `/payments/verify` | Any user | Verify Checkout signature, fetch payment, apply capture if confirmed. 20/min |
| GET | `/payments/:id/status` | Any user (owner) | Polling status with fulfilment state; triggers throttled gateway sync. 60/min |

### [M44](modules/M44-subscriptions.md) Subscriptions

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/subscriptions` | Parent, Student, Teacher, Institute staff (manager) | Live, queued and history (cursor) items with actions allowed |
| POST | `/subscriptions/:id/auto-renew` | Parent, Student | Turn AutoPay on (returns mandate checkout options) or off. 10/hour |
| POST | `/subscriptions/:id/auto-renew/confirm` | Parent, Student | Verify the mandate checkout signature and confirm AutoPay |
| POST | `/subscriptions/:id/cancel` | Parent, Student | Cancel at period end (If-Match) |
| POST | `/subscriptions/:id/resume` | Parent, Student | Undo a user cancellation before the period ends (If-Match) |
| GET | `/teacher/boosts` | Teacher | Premium / Featured status, prices, slots left, performance |

### [M45](modules/M45-payment-history.md) Payment History

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/payments` | Any user | Own payments, newest first (cursor), `?status=&purpose=` |
| GET | `/payments/:id` | Any user (owner) | Full breakdown, method, fulfilment, refund history |
| GET | `/payments/:id/invoice` | Any user (owner) | Presigned GST invoice URL (and credit note, if refunded) |
| POST | `/payments/:id/refund-request` | Any user (owner), Idempotency-Key | Create a refund request. 5/hour |

## Phase 13 · Referrals

### [M46](modules/M46-referral-system.md) Referral System

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/referrals/me` | Any user (not institute counsellor) | Own code, program rules/terms, share text, stats |
| GET | `/referrals` | Any user (not institute counsellor) | Invites sent, newest first (cursor) |
| POST | `/referrals/apply` | Any user, Idempotency-Key | Apply a code within 7 days of signup |
| GET | `/wallet` | Any user | Balance and ledger (cursor) |

## Phase 14 · Notifications

### [M47](modules/M47-push-notifications.md) Push Notifications

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/notifications/:id/opened` | Any user (owner) | Mark a notification opened; for a campaign, also updates its recipient row and `opened_count` |

### [M48](modules/M48-notification-center.md) Notification Center

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/notifications` | Any user | Inbox, newest first (cursor), `?category=`, with per-category unread counts |
| GET | `/notifications/unread-count` | Any user | Total and per-category unread counts (badge source) |
| POST | `/notifications/read` | Any user | Mark specific ids, or all (optionally one category), read |
| DELETE | `/notifications/:id` | Any user (owner) | Soft-delete one notification (swipe) |

## Phase 15 · Complaints

### [M49](modules/M49-report-user.md) Report User

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/reports` | Any user | File a safety report (Idempotency-Key) |
| POST | `/blocks` | Any user | Block a user (Idempotency-Key) |
| DELETE | `/blocks/:blockedUserId` | Any user | Unblock |
| GET | `/blocks` | Any user | List the caller's active blocks |

### [M50](modules/M50-complaint-history.md) Complaint History

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/reports` | Any user | My cases, filed or against me, cursor-paginated |
| GET | `/reports/:id` | Any user | Case detail with side-filtered timeline |
| POST | `/reports/:id/reply` | Any user | Reply to an open information request (Idempotency-Key) |

## Phase 16 · Settings

### [M51](modules/M51-account-settings.md) Account Settings

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/account` | Any user | Profile and linked sign-in methods |
| PATCH | `/account` | Any user | Update name / language (If-Match) |
| POST | `/account/phone/otp` | Any user | Send OTP to a new phone |
| POST | `/account/phone/verify` | Any user | Verify and apply the new phone |
| POST | `/account/email/otp` | Any user | Send OTP to a new email |
| POST | `/account/email/verify` | Any user | Verify and apply the new email |
| PUT | `/account/password` | Any user | Set or change the password |
| POST | `/account/identities/google` | Any user | Link a Google account |
| DELETE | `/account/identities/:id` | Any user | Unlink password or Google |

### [M52](modules/M52-privacy-settings.md) Privacy Settings

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/privacy` | Any user | Current privacy settings (defaults if unset) |
| PATCH | `/privacy` | Any user | Update display/behaviour toggles (If-Match) |
| GET | `/consents` | Any user | Latest consent per type, `requiresReconsent` flag |
| POST | `/consents` | Any user | Grant or withdraw a consent (Idempotency-Key) |
| POST | `/privacy/data-export` | Any user | Request a data export email (rate limited) |

### [M53](modules/M53-help-support.md) Help & Support

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/faqs` | Any user (also Public) | Search/browse FAQs |
| POST | `/faqs/:id/feedback` | Any user (also Public) | Was this helpful |
| GET | `/support/tickets` | Any user | My tickets, cursor-paginated |
| POST | `/support/tickets` | Any user | Create a ticket (Idempotency-Key) |
| GET | `/support/tickets/:id` | Any user | Ticket with full conversation |
| POST | `/support/tickets/:id/messages` | Any user | Send a message (Idempotency-Key via clientMessageId) |
| POST | `/support/tickets/:id/rating` | Any user | Rate a resolved/closed ticket |

### [M54](modules/M54-delete-account.md) Delete Account

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/account/deletion` | Any user | Current request status and live blocker check |
| POST | `/account/deletion/otp` | Any user | Send confirmation OTP |
| POST | `/account/deletion` | Any user | Confirm and schedule deletion (30-day grace) |
| POST | `/account/deletion/cancel` | Any user | Cancel a scheduled deletion |

