# 04 · React Native App Structure

Expo SDK 52 development build, React Native 0.76+ (New Architecture), TypeScript strict, React Navigation 7, TanStack Query v5, Zustand, React Hook Form + Zod. Full library list in `00-conventions.md` §2.

## Folder layout

```
apps/mobile/
  app.config.ts
  src/
    app/                App.tsx, providers, navigation/ (RootNavigator, linking.ts, types.ts)
    features/<module>/  screens/, components/, hooks/, api.ts, store.ts, __tests__/
    components/ui/      Button, TextField, PhoneField, OtpInput, Select, Chip, Card, Avatar, Badge, StatusPill, Skeleton, EmptyState, ErrorState, BottomSheet, Toast, StickyActionBar, ConfirmSheet, ImagePickerField, DocumentPickerField
    components/domain/  TeacherCard, InstituteCard, VerifiedBadge, TrustScoreRing, RatingStars, PriceTag, ChildChip, LocationPill
    lib/                api.ts, queryClient.ts, storage.ts, push.ts, upload.ts, format.ts, analytics.ts, errors.ts, deeplinks.ts
    theme/              tokens.ts
    i18n/               en.json, hi.json
  packages/shared/      Zod schemas, enums, error codes, fee codes (imported by both the app and the API)
```

## App shell & tab navigators

- Root sequence: Splash (M01) → Onboarding/Auth (M02–M05) or role tabs, chosen from `GET /me` (M00).
- **Parent tabs:** Home (M08) · Search (M27/M28) · Saved (M40/M41) · Requests (M37/M38) · Profile (M09).
- **Student tabs:** Home (M12) · Search · Saved · Requests · Profile.
- **Teacher tabs:** Dashboard (M18) · Leads (M37) · Reviews (M36) · Profile (M17).
- **Institute tabs:** Dashboard (M23) · Enquiries (M39) · Teachers (M25) · Profile (M24).
- Settings, notifications, help, trust score and complaint screens are pushed from Profile on every role.
- **Deep linking:** custom scheme `gc://` and universal links on `https://guruconnect.in` (paths in `00-conventions.md` §4); a link needing auth is replayed after login (M00 BR-0.11).

## Route map (216 screens)

| Route | Screen component | Module | Purpose |
| --- | --- | --- | --- |
| Root navigator | `Root` | [M00](modules/M00-mobile-platform-foundation.md) | Chooses Splash → Maintenance/ForceUpdate → Onboarding/Auth → role tabs |
| Global offline banner | (overlay) | [M00](modules/M00-mobile-platform-foundation.md) | Shows when offline; tap for details |
| Toast host | (overlay) | [M00](modules/M00-mobile-platform-foundation.md) | Success/error/info toasts |
| Error fallback | `ErrorFallback` | [M00](modules/M00-mobile-platform-foundation.md) | Crash fallback with Restart and request id |
| Account blocked | `AccountBlocked` | [M00](modules/M00-mobile-platform-foundation.md) | Shown when `/me` or any call returns `ACCOUNT_SUSPENDED` |
| Upload progress sheet | (bottom sheet) | [M00](modules/M00-mobile-platform-foundation.md) | Progress, retry and cancel for uploads |
| Splash | `Splash` | [M01](modules/M01-splash-screen.md) | Logo while bootstrap, session and caches load |
| Maintenance | `Maintenance` | [M01](modules/M01-splash-screen.md) | Admin message, expected end time, Try again |
| Force update | `ForceUpdate` | [M01](modules/M01-splash-screen.md) | Blocks the app below the minimum version, opens the store |
| Optional update sheet | `UpdateSheet` (modal) | [M01](modules/M01-splash-screen.md) | Suggests updating; dismissible |
| No connection | `NoConnection` | [M01](modules/M01-splash-screen.md) | First launch without internet and no cached bootstrap |
| Onboarding | `Onboarding` | [M02](modules/M02-onboarding-screens.md) | Full-screen 4-slide swipeable carousel |
| Auth select | `AuthSelect` | [M03](modules/M03-authentication-selection.md) | Choose phone, Google or email to continue |
| Phone entry | `PhoneEntry` | [M04](modules/M04-login.md) | Collect and submit the phone number |
| OTP verify | `OtpVerify` | [M04](modules/M04-login.md) | 6-digit code entry with autofill, used for phone and email |
| Email entry | `EmailEntry` | [M04](modules/M04-login.md) | Email + password, with a link to email-OTP instead |
| Forgot password | `ForgotPassword` | [M04](modules/M04-login.md) | Collect email to send a reset OTP |
| Reset password | `ResetPassword` | [M04](modules/M04-login.md) | Enter the OTP and a new password together |
| Active sessions | `ActiveSessions` | [M04](modules/M04-login.md) | List signed-in devices; sign one (or all) out |
| Registration router | `RegistrationRouter` | [M05](modules/M05-registration.md) | Choose Parent / Student / Teacher / Institute |
| Referral code sheet | `ReferralCodeSheet` (bottom sheet) | [M05](modules/M05-registration.md) | Enter/confirm a referral code before continuing |
| Parent registration | `ParentRegistration` | [M06](modules/M06-parent-registration.md) | Name, mobile (+ inline verify if needed), email, state/city/area |
| My children | `MyChildren` | [M07](modules/M07-parent-child-setup.md) | List of children (or the mandatory empty state), add/reorder entry point |
| Add / edit child | `ChildForm` (modal) | [M07](modules/M07-parent-child-setup.md) | Name, class, board, subjects, categories, mode |
| Recommendations preview | (bottom sheet, shown after save) | [M07](modules/M07-parent-child-setup.md) | Top 3 matches for the just-saved child |
| Parent home | `ParentHome` | [M08](modules/M08-parent-dashboard.md) | Child switcher, banners, five rails |
| Rail list | `RailListScreen` | [M08](modules/M08-parent-dashboard.md) | Full paginated list for one rail |
| No children card | (embedded in `ParentHome`) | [M08](modules/M08-parent-dashboard.md) | Prompt to add the first child |
| Parent profile | `ParentProfile` | [M09](modules/M09-parent-profile.md) | Header, summary, menu list |
| Edit profile | `EditParentProfile` | [M09](modules/M09-parent-profile.md) | Name, photo, city/area form |
| Plans | `ParentPlans` | [M10](modules/M10-parent-subscription.md) | Plan cards, current status banner, Subscribe |
| Subscription detail | `ParentSubscriptionDetail` | [M10](modules/M10-parent-subscription.md) | Status, dates, auto-renew toggle, cancel |
| Student details | `StudentRegistrationForm` | [M11](modules/M11-student-registration.md) | Name, class, board, school, subjects, city/area |
| Parent contact | `StudentParentContactStep` | [M11](modules/M11-student-registration.md) | Parent name/phone (shown only when required or offered) |
| Consent pending | `ParentConsentPending` | [M11](modules/M11-student-registration.md) | Explains the SMS step; resend, help |
| Consent OTP | `ParentConsentOtp` | [M11](modules/M11-student-registration.md) | 6-digit code entry (typed by the parent) |
| Student home | `StudentHome` | [M12](modules/M12-student-dashboard.md) | Banners, five rails |
| Rail list | `RailListScreen` | [M12](modules/M12-student-dashboard.md) | Full paginated list for one rail (shared component with Module 8) |
| Plans | `StudentPlans` | [M13](modules/M13-student-subscription.md) | Plan cards, current status (including "Covered by parent"), Subscribe |
| Subscription detail | `StudentSubscriptionDetail` | [M13](modules/M13-student-subscription.md) | Status, dates, trial contacts remaining, auto-renew, cancel |
| Registration intro | `TeacherRegIntro` | [M14](modules/M14-teacher-registration.md) | Explains the 7 steps + document upload + optional fee before starting |
| Personal details | `TeacherRegBasics` | [M14](modules/M14-teacher-registration.md) | Name, gender, DOB, email, category, languages |
| Qualifications | `TeacherRegQualifications` | [M14](modules/M14-teacher-registration.md) | List of qualifications added so far, "Add qualification" |
| Add/edit qualification | `TeacherRegQualificationForm` (modal) | [M14](modules/M14-teacher-registration.md) | Level, degree, institution, year, grade, highest toggle |
| Experience | `TeacherRegExperience` | [M14](modules/M14-teacher-registration.md) | Years, highest qualification text, bio, indicative fee, demo toggle |
| Subjects | `TeacherRegSubjects` | [M14](modules/M14-teacher-registration.md) | Multi-select subjects grouped by category, primary picker, experience per subject |
| Classes | `TeacherRegClasses` | [M14](modules/M14-teacher-registration.md) | Multi-select classes, optional board per class |
| Teaching modes | `TeacherRegModes` | [M14](modules/M14-teacher-registration.md) | Chip multi-select (Online, Home tuition, At teacher's place, Hybrid) |
| Locations | `TeacherRegLocations` | [M14](modules/M14-teacher-registration.md) | City/area picker, radius slider, "Skip" when online-only |
| Documents overview | `TeacherDocuments` | [M15](modules/M15-teacher-document-upload.md) | Checklist of the four required + two optional document types with status |
| Document capture | `TeacherDocumentCapture` | [M15](modules/M15-teacher-document-upload.md) | Camera / picker for one document, with a masked-number field for Aadhaar/PAN |
| Document preview | `TeacherDocumentPreview` | [M15](modules/M15-teacher-document-upload.md) | Thumbnail + masked number before confirming upload |
| Payment sheet | (reused from M43) `PaymentSheet` | [M15](modules/M15-teacher-document-upload.md) | Razorpay checkout for the registration fee |
| Submitted confirmation | `TeacherRegistrationSubmitted` | [M15](modules/M15-teacher-document-upload.md) | "Under review" screen, links to Verification Status (M16) |
| Verification status | `TeacherVerificationStatus` | [M16](modules/M16-teacher-verification-status.md) | Status banner, document checklist, timeline, resubmit / re-apply action |
| Rejection detail | (sheet within the same screen) | [M16](modules/M16-teacher-verification-status.md) | Reason and re-apply eligibility |
| Profile home | `TeacherProfile` | [M17](modules/M17-teacher-profile-builder.md) | Completeness card, section list (About, Subjects, Classes, Modes, Locations, Fees, Availability), preview button |
| About editor | `TeacherProfileAbout` | [M17](modules/M17-teacher-profile-builder.md) | Photo, bio, languages, category |
| Experience editor | `TeacherProfileExperience` | [M17](modules/M17-teacher-profile-builder.md) | Years, highest qualification, indicative fee, demo toggle |
| Fee plans list | `TeacherFeePlans` | [M17](modules/M17-teacher-profile-builder.md) | List of fee plans, add/edit/delete, reorder |
| Fee plan editor | `TeacherFeePlanForm` (sheet) | [M17](modules/M17-teacher-profile-builder.md) | Label, subject, class range, mode, unit, amount, sessions |
| Profile preview | `TeacherProfilePreview` | [M17](modules/M17-teacher-profile-builder.md) | Read-only render of the public profile |
| Teacher dashboard | `TeacherDashboard` | [M18](modules/M18-teacher-dashboard.md) | KPI tiles, trust score card, completeness nudge, unanswered-leads banner, recent activity |
| Availability | `TeacherAvailability` | [M19](modules/M19-teacher-availability.md) | Weekly grid editor + time-off list |
| Time off form | `TeacherTimeOffForm` (sheet) | [M19](modules/M19-teacher-availability.md) | Date range, reason, pause-leads toggle |
| Time-off clash confirm | (dialog within the sheet) | [M19](modules/M19-teacher-availability.md) | Lists affected demos, Cancel-them / Change-dates |
| Notification settings | `NotificationSettings` | [M20](modules/M20-teacher-notifications.md) | Per-category push/email toggles, optional quiet hours per category |
| Institute & owner details | `InstituteRegDetails` | [M21](modules/M21-institute-registration.md) | Step 1 of 2: name, type, owner name, mobile, email, GSTIN |
| Institute type sheet | `InstituteTypeSheet` (bottom sheet) | [M21](modules/M21-institute-registration.md) | Pick one of the 8 institute types |
| Location | `InstituteRegLocation` | [M21](modules/M21-institute-registration.md) | Step 2 of 2: address, city, area, PIN, pin preview, consent, create account |
| City / area picker | `CityAreaSheet` (bottom sheet) | [M21](modules/M21-institute-registration.md) | Searchable list of cities, then areas of the city |
| Map pin picker | `InstituteMapPin` (modal) | [M21](modules/M21-institute-registration.md) | Full-screen map with fixed centre pin |
| Verify mobile | `InstituteRegVerifyPhone` | [M21](modules/M21-institute-registration.md) | Only for email/Google sign-ups: phone OTP (M04 components) |
| Join institute | `InstituteJoinInvite` | [M21](modules/M21-institute-registration.md) | Invited staff: confirm name, accept terms, join |
| Registration done | `InstituteRegDone` | [M21](modules/M21-institute-registration.md) | Success, then documents |
| Edit registration details | `InstituteBasicsEdit` | [M21](modules/M21-institute-registration.md) | Same fields, before submission or after docs are requested |
| Verification status | `InstituteVerification` | [M22](modules/M22-institute-verification.md) | Status hero, stepper, next action, visit or rejection card, recent timeline |
| Documents checklist | `InstituteDocuments` | [M22](modules/M22-institute-verification.md) | Required and optional document rows with status and actions |
| Upload document sheet | `InstituteDocUploadSheet` (bottom sheet) | [M22](modules/M22-institute-verification.md) | Source choice (camera, gallery, PDF), extra input, upload progress |
| Campus photos | `InstituteCampusPhotos` | [M22](modules/M22-institute-verification.md) | Grid of campus photos with captions, add and replace |
| Document viewer | `InstituteDocViewer` (modal) | [M22](modules/M22-institute-verification.md) | Secure preview of an uploaded document with review note |
| Review and submit | `InstituteSubmitReview` | [M22](modules/M22-institute-verification.md) | Summary, fee, "Pay & submit" or "Submit for review" |
| Payment | `PaymentSheet` (M43) | [M22](modules/M22-institute-verification.md) | Razorpay checkout |
| Submitted | `InstituteSubmitted` | [M22](modules/M22-institute-verification.md) | Confirmation with expected timelines |
| Full timeline | `InstituteVerificationTimeline` | [M22](modules/M22-institute-verification.md) | Paged timeline |
| Dashboard | `InstituteDashboard` | [M23](modules/M23-institute-dashboard.md) | Home tab: verification card or KPIs, trend chart, recent enquiries, tasks |
| Range picker | `DashboardRangeSheet` (bottom sheet) | [M23](modules/M23-institute-dashboard.md) | Choose 7, 30 or 90 days |
| Stat detail | `InstituteStatDetail` | [M23](modules/M23-institute-dashboard.md) | Daily bars for one KPI with the previous-period line and a short explainer |
| Staff list | `InstituteStaffList` | [M24](modules/M24-institute-manager.md) | Team directory: primary, managers, counsellors, invited, disabled |
| Invite staff | `InstituteStaffInvite` (bottom sheet) | [M24](modules/M24-institute-manager.md) | Name, phone, role, designation |
| Staff detail | `InstituteStaffDetail` | [M24](modules/M24-institute-manager.md) | View/edit one staff member's role and designation; disable |
| Institute profile edit | `InstituteProfileEdit` | [M24](modules/M24-institute-manager.md) | About, contact, address, facilities, capacity, fees, logo, cover |
| Facilities picker | `FacilitiesSheet` (bottom sheet) | [M24](modules/M24-institute-manager.md) | Multi-select checklist of the 14 facility tags |
| Batches | `InstituteBatches` | [M24](modules/M24-institute-manager.md) | List of courses/batches with seats and fee |
| Batch form | `InstituteBatchForm` (bottom sheet) | [M24](modules/M24-institute-manager.md) | Add / edit one batch |
| Teachers list | `InstituteTeachers` | [M25](modules/M25-institute-teacher-management.md) | Faculty list with status, subjects/classes, add button |
| Teacher form | `InstituteTeacherForm` | [M25](modules/M25-institute-teacher-management.md) | Add or edit one institute teacher (name, phone, subjects, classes, schedule) |
| Teacher detail | `InstituteTeacherDetail` | [M25](modules/M25-institute-teacher-management.md) | Read view for counsellors; managers see Edit/Remove/Link here |
| Link teacher sheet | `LinkTeacherSheet` (bottom sheet) | [M25](modules/M25-institute-teacher-management.md) | Enter a GuruConnect teacher code to send a link request |
| Institute invites (teacher app) | `TeacherInstituteInvites` | [M25](modules/M25-institute-teacher-management.md) | A teacher's pending link requests from institutes, accept/decline |
| Rating detail | `InstituteRatingDetail` | [M26](modules/M26-institute-rating-display.md) | Full breakdown: scores, evaluation date, public summary, user review summary, recent reviews; staff variant adds next review date and history |
| How we rate institutes | `InstituteRatingMethodSheet` (bottom sheet) | [M26](modules/M26-institute-rating-display.md) | Plain-language explainer of the four criteria and the 1–5 scale |
| Search home | `SearchHome` | [M27](modules/M27-teacher-search.md) | Teacher/Institute segmented control (Institute tab hands off to M28), search bar, quick filter chips, recent searches |
| Teacher search results | `TeacherSearchResults` | [M27](modules/M27-teacher-search.md) | Ranked, paged list with sort and quick filters |
| Suggestions dropdown | (inline overlay) | [M27](modules/M27-teacher-search.md) | Live suggestions under the search bar while typing |
| Sort sheet | `SearchSortSheet` (bottom sheet) | [M27](modules/M27-teacher-search.md) | Relevance (default) · Highest rated · Highest trust score · Nearest · Most experienced |
| Recent searches sheet | `RecentSearchesSheet` (bottom sheet) | [M27](modules/M27-teacher-search.md) | Full list of recent searches with per-item delete and "Clear all" |
| Institute search results | `InstituteSearchResults` | [M28](modules/M28-institute-search.md) | Ranked, paged institute list with Category/Rating quick filters |
| Institute filter sheet | `InstituteFilterSheet` (bottom sheet) | [M28](modules/M28-institute-search.md) | Category, City, Area, Rating |
| Filter sheet | `SearchFilterSheet` (bottom sheet, full-screen on small devices) | [M29](modules/M29-advanced-filters.md) | All filters for the current target, with live facet counts |
| Save search sheet | `SaveSearchSheet` (bottom sheet) | [M29](modules/M29-advanced-filters.md) | Name the current filter set, toggle daily alert |
| Saved searches list | `SavedSearchesScreen` | [M29](modules/M29-advanced-filters.md) | All saved searches with edit/delete/alert toggle |
| Recommendations feed | `RecommendationsFeed` | [M30](modules/M30-recommendation-engine.md) | Full-screen "See all" for a dashboard rail, paged |
| Not-interested sheet | `NotInterestedSheet` (bottom sheet) | [M30](modules/M30-recommendation-engine.md) | Confirm dismissal, optional reason |
| Manage recommendations | `ManageRecommendationsScreen` | [M30](modules/M30-recommendation-engine.md) | List of dismissals for the active child, with undo |
| Teacher profile | `TeacherProfile` | [M31](modules/M31-teacher-profile-view.md) | Full profile for a signed-in learner |
| Teacher profile (limited) | `TeacherProfilePublic` | [M31](modules/M31-teacher-profile-view.md) | Subset shown to a signed-out Public viewer |
| Fee plans (all) | `TeacherFeePlansSheet` (bottom sheet) | [M31](modules/M31-teacher-profile-view.md) | Full fee table beyond the "From ₹X" summary |
| Qualifications detail | `TeacherQualificationsSheet` (bottom sheet) | [M31](modules/M31-teacher-profile-view.md) | Full list with institution/year |
| Similar teachers (all) | `SimilarTeachersScreen` | [M31](modules/M31-teacher-profile-view.md) | Full list beyond the inline rail |
| Institute profile | `InstituteProfile` | [M32](modules/M32-institute-profile-view.md) | Full profile for a signed-in learner |
| Institute profile (limited) | `InstituteProfilePublic` | [M32](modules/M32-institute-profile-view.md) | Subset shown to a signed-out Public viewer |
| Gallery | `InstituteGalleryScreen` | [M32](modules/M32-institute-profile-view.md) | Full-screen photo gallery |
| Teachers list | `InstituteTeachersScreen` | [M32](modules/M32-institute-profile-view.md) | Full list beyond the inline preview |
| Batches list | `InstituteBatchesScreen` | [M32](modules/M32-institute-profile-view.md) | Full list with the class/subject filter toggle |
| Share sheet | `ShareProfileSheet` (bottom sheet, wraps the native share sheet) | [M33](modules/M33-profile-sharing.md) | Choose channel, see the short link, copy or send |
| Share history | `ShareHistoryScreen` | [M33](modules/M33-profile-sharing.md) | The caller's past shares with open/install counts |
| Teacher reviews | `TeacherReviews` | [M34](modules/M34-teacher-reviews.md) | Rating summary, filters and the full list of a teacher's published reviews |
| Write / edit review | `WriteReview` | [M34](modules/M34-teacher-reviews.md) | Stars, child picker, text; create or edit (modal stack) |
| Not eligible sheet | `ReviewEligibilitySheet` (bottom sheet) | [M34](modules/M34-teacher-reviews.md) | Explains why the user can't review yet and what to do |
| Review submitted | `ReviewSubmitted` | [M34](modules/M34-teacher-reviews.md) | Confirmation with moderation expectation |
| Report review sheet | `ReportReviewSheet` (bottom sheet) | [M34](modules/M34-teacher-reviews.md) | Reason chips and optional details |
| Delete review sheet | `DeleteReviewSheet` (bottom sheet) | [M34](modules/M34-teacher-reviews.md) | Confirm deletion |
| My reviews | `MyReviews` | [M34](modules/M34-teacher-reviews.md) | Reviews the user wrote, with status and actions |
| Institute reviews | `InstituteReviews` | [M35](modules/M35-institute-reviews.md) | Summary with aspect bars and published reviews of an institute |
| Write / edit institute review | `WriteInstituteReview` | [M35](modules/M35-institute-reviews.md) | Overall stars, optional aspects, text |
| Institute review eligibility sheet | `InstituteReviewEligibilitySheet` (bottom sheet) | [M35](modules/M35-institute-reviews.md) | Why the user can't review yet |
| Report review sheet | `ReportReviewSheet` (bottom sheet, from M34) | [M35](modules/M35-institute-reviews.md) | Reused with `reviewType = institute` |
| Institute reviews inbox | `InstituteReviewsInbox` | [M35](modules/M35-institute-reviews.md) | Staff list of reviews with filters and reply status |
| Reply to review | `InstituteReviewReply` | [M35](modules/M35-institute-reviews.md) | Staff write, edit or delete the institute's reply |
| Teacher reviews tab | `TeacherMyReviews` | [M36](modules/M36-teacher-reply-to-review.md) | Summary, filters and list of published/flagged reviews on my profile |
| Reply to review | `TeacherReviewReply` | [M36](modules/M36-teacher-reply-to-review.md) | Write, edit or delete my reply |
| Delete reply sheet | `DeleteReplySheet` (bottom sheet) | [M36](modules/M36-teacher-reply-to-review.md) | Confirm reply deletion |
| Report review sheet | `ReportReviewSheet` (bottom sheet, M34) | [M36](modules/M36-teacher-reply-to-review.md) | Report a review of my profile |
| Contact sheet | `ContactTeacherSheet` (bottom sheet) | [M37](modules/M37-contact-teacher.md) | Choose Call / Message / Call-back and pick child and subject |
| Call-back / message form | `LeadRequestForm` | [M37](modules/M37-contact-teacher.md) | Details for a call-back request or first message |
| Request sent | `LeadSent` | [M37](modules/M37-contact-teacher.md) | Confirmation with next steps |
| Unlock contact sheet | `UnlockContactSheet` (bottom sheet) | [M37](modules/M37-contact-teacher.md) | Membership or pay-per-contact to reveal numbers |
| Call options sheet | `CallOptionsSheet` (bottom sheet) | [M37](modules/M37-contact-teacher.md) | Direct call, masked call, WhatsApp |
| My requests | `MyRequests` | [M37](modules/M37-contact-teacher.md) | Learner Requests tab: leads (and demos segment from M38) |
| Lead conversation | `LeadDetail` | [M37](modules/M37-contact-teacher.md) | Header with status and actions + message thread (both roles) |
| Message actions sheet | `MessageActionsSheet` (bottom sheet) | [M37](modules/M37-contact-teacher.md) | Copy, delete (own, 10 min), report (other side) |
| Close request sheet | `CloseLeadSheet` (bottom sheet) | [M37](modules/M37-contact-teacher.md) | Requester closes or marks classes started |
| Teacher leads inbox | `TeacherLeads` | [M37](modules/M37-contact-teacher.md) | Teacher Leads tab: New / In progress / Closed |
| Lead actions sheet | `LeadActionsSheet` (bottom sheet) | [M37](modules/M37-contact-teacher.md) | Teacher: mark contacted, classes started, decline |
| Decline sheet | `DeclineLeadSheet` (bottom sheet) | [M37](modules/M37-contact-teacher.md) | Teacher picks a decline reason |
| Book demo | `BookDemo` | [M38](modules/M38-demo-class-request.md) | Pick a date/time slot (teacher) or a preferred window (institute), subject, child, note |
| Demo booked | `DemoBooked` | [M38](modules/M38-demo-class-request.md) | Confirmation and what happens next |
| Demo detail | `DemoDetail` | [M38](modules/M38-demo-class-request.md) | Slot, meeting link, status and actions for either side |
| Reschedule sheet | `RescheduleDemoSheet` (bottom sheet) | [M38](modules/M38-demo-class-request.md) | Pick a new slot to propose |
| Cancel sheet | `CancelDemoSheet` (bottom sheet) | [M38](modules/M38-demo-class-request.md) | Reason, confirm |
| No-show sheet | `NoShowSheet` (bottom sheet) | [M38](modules/M38-demo-class-request.md) | Who didn't attend, reason |
| Outcome sheet | `DemoOutcomeSheet` (bottom sheet) | [M38](modules/M38-demo-class-request.md) | Enrolled / Not enrolled / Still deciding |
| Institute enquiries inbox | `InstituteEnquiries` | [M39](modules/M39-contact-institute.md) | Staff tabs All / Mine / Unassigned / Needs reply / Closed |
| Enquiry detail | `InstituteEnquiryDetail` | [M39](modules/M39-contact-institute.md) | Thread (M37 components), assigned staff, linked campus visit, actions |
| Assign sheet | `AssignEnquirySheet` (bottom sheet) | [M39](modules/M39-contact-institute.md) | Pick an active institute teacher, or unassign |
| Decline sheet | `DeclineEnquirySheet` (bottom sheet, M37 reasons) | [M39](modules/M39-contact-institute.md) | Institute-worded decline reasons |
| Favorites | `Favorites` | [M40](modules/M40-favorite-teachers.md) | Saved teachers list (segment shared with M41's institutes) |
| Favorite note sheet | `FavoriteNoteSheet` (bottom sheet) | [M40](modules/M40-favorite-teachers.md) | Tag a child and add/edit a private note |
| Favorites — Institutes segment | `Favorites` (M40, `segment=institutes`) | [M41](modules/M41-favorite-institutes.md) | Reused unchanged; adds compare-select mode |
| Compare institutes | `CompareInstitutes` | [M41](modules/M41-favorite-institutes.md) | Side-by-side of 2–3 saved institutes |
| Trust score sheet | `TrustScoreSheet` (bottom sheet) | [M42](modules/M42-trust-score-display.md) | Public breakdown for any teacher, opened from a card or the profile |
| My trust score | `MyTrustScore` | [M42](modules/M42-trust-score-display.md) | Teacher's own full breakdown, tips and frozen/override banner |
| Score history | `TrustScoreHistory` | [M42](modules/M42-trust-score-display.md) | 90-day line chart and a de-identified event timeline |
| Payment sheet | `PaymentSheet` (modal bottom sheet) | [M43](modules/M43-payment-gateway.md) | Item, price breakdown, GST, wallet toggle, Pay button |
| Razorpay Checkout | (native, opened by `react-native-razorpay`) | [M43](modules/M43-payment-gateway.md) | UPI apps, UPI ID, cards, net banking |
| Payment result | `PaymentResult` | [M43](modules/M43-payment-gateway.md) | Success, processing, failed, cancelled, expired states with next actions |
| Price changed sheet | `PriceChangedSheet` (bottom sheet) | [M43](modules/M43-payment-gateway.md) | Shows old vs new price after `price_changed` |
| Payment help sheet | `PaymentHelpSheet` (bottom sheet) | [M43](modules/M43-payment-gateway.md) | "Money debited but not confirmed?" guidance and support link |
| My plan | `MyPlan` | [M44](modules/M44-subscriptions.md) | Current plan/registration card, AutoPay row, queued period, actions, history |
| Cancel membership sheet | `CancelSubscriptionSheet` (bottom sheet) | [M44](modules/M44-subscriptions.md) | Reason, what happens next, refund hint, confirm |
| AutoPay sheet | `AutoPaySheet` (bottom sheet) | [M44](modules/M44-subscriptions.md) | Explains AutoPay before opening the mandate checkout; turn-off confirmation |
| AutoPay setup result | `AutoPayResult` (modal) | [M44](modules/M44-subscriptions.md) | On, pending or failed after the mandate checkout |
| Teacher boosts | `TeacherBoosts` | [M44](modules/M44-subscriptions.md) | Premium and Featured status, price, slots left, performance, Buy/Extend |
| Boost info sheet | `BoostInfoSheet` (bottom sheet) | [M44](modules/M44-subscriptions.md) | What Premium / Featured does, with an example card |
| Payment history | `PaymentHistory` | [M45](modules/M45-payment-history.md) | Every payment, newest first, with status and amount |
| Payment detail | `PaymentDetail` | [M45](modules/M45-payment-history.md) | Breakdown, method, fulfilment, invoice, refund history and action |
| Request refund sheet | `RefundRequestSheet` (bottom sheet) | [M45](modules/M45-payment-history.md) | Reason, note, confirm |
| Referral code | `ReferralCode` | [M46](modules/M46-referral-system.md) | The user's code, share button, stats summary, "Enter a code" entry point |
| Invite friends | `InviteFriends` | [M46](modules/M46-referral-system.md) | Share sheet, how-it-works steps, program terms |
| Referral earnings | `ReferralEarnings` | [M46](modules/M46-referral-system.md) | Invited list with status and reward per person |
| Wallet | `Wallet` | [M46](modules/M46-referral-system.md) | Balance and the full credit/debit ledger |
| Apply code sheet | `ApplyCodeSheet` (bottom sheet) | [M46](modules/M46-referral-system.md) | Enter or confirm a referral code within 7 days of signup |
| Push permission explainer | `PushPermissionExplainer` (bottom sheet) | [M47](modules/M47-push-notifications.md) | Shown once per meaningful moment, before the OS permission prompt |
| Notification center | `NotificationCenter` | [M48](modules/M48-notification-center.md) | Category tabs, the full inbox list, mark-all-read, swipe to delete |
| Report user | `ReportUser` | [M49](modules/M49-report-user.md) | Reason, description, evidence, block switch |
| Report submitted | `ReportSubmitted` | [M49](modules/M49-report-user.md) | Confirmation with case number, link to M50 |
| Blocked users | `BlockedUsers` | [M49](modules/M49-report-user.md) | List of people the caller has blocked, with unblock |
| Block confirm | (bottom sheet) `BlockConfirmSheet` | [M49](modules/M49-report-user.md) | Confirms a standalone block from a profile or chat |
| My reports | `MyReports` | [M50](modules/M50-complaint-history.md) | Tabs: Filed / Against me; status filter |
| Report detail | `ReportDetail` | [M50](modules/M50-complaint-history.md) | Timeline, reply box when open |
| Account settings | `AccountSettings` | [M51](modules/M51-account-settings.md) | Name, language, sign-in methods, sessions, sign out |
| Change phone | `ChangePhone` | [M51](modules/M51-account-settings.md) | New phone → OTP |
| Change email | `ChangeEmail` | [M51](modules/M51-account-settings.md) | New email → OTP |
| Set/change password | `ChangePassword` | [M51](modules/M51-account-settings.md) | Current + new, or OTP + new |
| Active sessions | `ActiveSessions` | [M51](modules/M51-account-settings.md) | Device list, revoke |
| Privacy settings | `PrivacySettings` | [M52](modules/M52-privacy-settings.md) | Display toggles, consents, data export |
| Reconsent | `ReconsentSheet` (blocking modal) | [M52](modules/M52-privacy-settings.md) | Forces agreement to an updated Terms/Privacy Policy |
| Help home | `HelpHome` | [M53](modules/M53-help-support.md) | FAQ search, categories, contact options |
| FAQ detail | `FaqDetail` | [M53](modules/M53-help-support.md) | Answer, was-this-helpful |
| My tickets | `SupportTickets` | [M53](modules/M53-help-support.md) | List with status |
| New ticket | `NewTicket` | [M53](modules/M53-help-support.md) | Category, subject, message, attachments |
| Ticket detail | `TicketDetail` | [M53](modules/M53-help-support.md) | Conversation thread, composer, rating |
| Delete account intro | `DeleteAccountIntro` | [M54](modules/M54-delete-account.md) | Reason survey, blockers, what happens |
| Delete account OTP | `DeleteAccountOtp` | [M54](modules/M54-delete-account.md) | Confirms identity |
| Deletion scheduled | `DeletionScheduled` | [M54](modules/M54-delete-account.md) | Countdown, Cancel deletion |

## Shared components (build in M00, reused everywhere)

| Component | Purpose |
| --- | --- |
| `TeacherCard` / `InstituteCard` | Photo, name, badge, rating, distance, price — used in search, dashboard, favourites |
| `VerifiedBadge` | Green check + "Verified" — only for `verification_status = approved` |
| `TrustScoreRing` | 0–100 ring coloured by band, never colour alone (number shown) |
| `RatingStars` | Half-star support, reused for teacher and institute ratings |
| `PriceTag` | ₹ from paise, `/hr` or `/month` suffix |
| `OtpInput` | 6-cell autofill (Android SMS Retriever, iOS `oneTimeCode`) |
| `EmptyState` / `ErrorState` | Every list/detail screen's empty and error states (conventions §14) |
| `StickyActionBar` | Bottom-anchored primary action on forms and detail screens |

## Hooks (per feature, on top of M00's `useApi`)

`useMe`, `useMasters`, `useAreas(cityId)`, `useUpload(purpose)`, `useChildrenQuery`, `useSearchTeachers(filters)`, `useRecommendations(childId)`, `useLead(id)`, `useDemoSlots(teacherId)`, `useFavorites`, `useTrustScore(teacherId)`, `usePlans(role)`, `useSubscription`, `useWallet`, `useNotifications`, `useNotificationPreferences`.
