# 03 · Push Notification Catalogue

Every push / in-app notification event across the mobile app, drawn from each module's §16. Delivery mechanics (device registration, quiet hours, Android channels, tap handling) are defined once in **M00** and restated as a contract in **M47**; this page is the full list used to build `NotificationService` templates.
**208 distinct events** listed below.


## [M00](modules/M00-mobile-platform-foundation.md) Mobile Platform Foundation

This module provides the delivery infrastructure; it sends no events of its own. Android channels are created at first launch: `leads` (high), `account`, `payments`, `reviews` (default), `general` (low). The app handles notification taps in the three states described in conventions §9 and marks the item read via M48.

## [M04](modules/M04-login.md) Login

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Password changed | Account owner | "Your password was changed" / "If this wasn't you, contact support immediately." | `gc://account/security` | account | yes |
| Signed out everywhere (reuse detected) | Account owner | "We signed you out for your security" / "A sign-in token was reused from another device. Please sign in again." | `gc://login` | account | yes |
| New device signed in (optional, only when > 1 active session already existed) | Account owner | "New sign-in to your account" / "{deviceLabel} · {city}" | `gc://account/security` | account | no |

## [M07](modules/M07-parent-child-setup.md) Parent Child Setup

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| New match appears later for a child with zero matches at save time | Parent | "A teacher for {childName} just joined" / "{teacherName} teaches {subject} near you." | `gc://t/{teacherPublicCode}` | recommendations | no |
No push at save time itself — the in-app preview sheet (BR-7.6) already shows the result synchronously; the push above only fires later, from the same recommendation-recompute job triggered elsewhere (a newly approved teacher), for a child that previously had none.

## [M10](modules/M10-parent-subscription.md) Parent Subscription

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `subscription.trial_ending` | Parent | "Your trial ends tomorrow" / "Subscribe to keep contacting teachers without interruption." | `gc://plans` | subscription | no |
| `subscription.renewal_reminder` | Parent | "Renews in 7 days" / "Your {plan} renews on {date} for {price}." | `gc://plans` | subscription | no |
| `subscription.grace_started` | Parent | "Payment failed" / "We couldn't renew your membership. Update payment within 3 days to avoid losing access." | `gc://plans` | subscription | yes |
| `subscription.expired` | Parent | "Membership ended" / "Subscribe again to keep contacting teachers." | `gc://plans` | subscription | no |
| `subscription.moved_to_free_access` / `.moved_to_trial` | Parent | "Membership is now free" / "on your {plan} switch from free" | `gc://plans` | subscription | no |
In-app inbox mirrors all of the above (Module 48); none are `urgent` except the grace start (protects against a lapse the parent didn't notice).

## [M11](modules/M11-student-registration.md) Student Registration

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `student.parental_consent_confirmed` | Student | "Your parent approved!" / "You can now contact teachers and book demos." | `gc://home` | account | no |
| `student.parental_consent_declined` | Student | "Account on hold" / "Your parent asked us to hold your account. Contact support for help." | `gc://support` | account | yes |
The OTP itself is SMS, not a push (the parent has no app session). In-app only: the pending banner on Home is derived from `/me`, not a stored notification.

## [M13](modules/M13-student-subscription.md) Student Subscription

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `subscription.trial_contacts_low` | Student | "1 free contact left" / "Subscribe to keep contacting teachers without limits." | `gc://plans` | subscription | no |
| `subscription.trial_ending` | Student | "Your trial ends tomorrow" / same copy as Module 10 | `gc://plans` | subscription | no |
| `subscription.renewal_reminder` / `.grace_started` / `.expired` / `.moved_to_free_access` / `.moved_to_trial` | Student | Same templates as Module 10, student-scoped | `gc://plans` | subscription | grace only |
`trial_contacts_low` fires once, when `trialContactsUsed = trialContactsLimit − 1`, from Module 37's contact-creation path.

## [M15](modules/M15-teacher-document-upload.md) Teacher Document Upload

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Registration submitted | Teacher | "Application submitted" / "We're reviewing your documents. Most reviews finish within 24 hours." | `gc://teacher/verification` | verification | No |
No push for individual document uploads — only the submission confirmation (also shown in-app immediately, so the push mainly reaches a backgrounded app).

## [M16](modules/M16-teacher-verification-status.md) Teacher Verification Status

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Document approved | Teacher | "Document approved" / "Your {docType} has been approved." | `gc://teacher/verification` | verification | No |
| Re-upload requested | Teacher | "Action needed on your application" / "We need a clearer copy of your {docType}." | `gc://teacher/verification` | verification | No |
| Application approved | Teacher | "You're verified! 🎉" / "Your GuruConnect profile is now live. Complete it to start getting leads." | `gc://teacher/verification` | verification | Yes |
| Application rejected | Teacher | "Update on your application" / "Your application wasn't approved this time." | `gc://teacher/verification` | verification | No |
All are sent by Admin M16's actions (Module 0's `NotificationService`) and Module 15's submit confirmation; this module only consumes them to refresh its own screen (BR-16.8).

## [M19](modules/M19-teacher-availability.md) Teacher Availability

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Demo cancelled by time off | Requester (parent/student) | "Your demo was cancelled" / "{Teacher} marked this time as unavailable. Find another slot or teacher." | `gc://demos/:id` | demos | No |
Sent as part of Module 38's normal demo-cancellation notification pipeline when BR-19.3's `confirmForce` path runs; this module triggers the state change, Module 38/0 own the actual push template.

## [M20](modules/M20-teacher-notifications.md) Teacher Notifications

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| New lead | Teacher | "New lead!" / "{requester} is looking for a {subject} teacher for {class}." | `gc://teacher/leads/:id` | leads | Yes |
| Unanswered-lead reminder (6h, 20h) | Teacher | "Still waiting for your reply" / "{requester}'s enquiry has been open for {n} hours." | `gc://teacher/leads/:id` | leads | No |
| Demo reminder (1h before) | Teacher | "Demo in 1 hour" / "Your demo with {requester} starts at {time}." | `gc://demos/:id` | demos | No |
| Document approved / re-upload / application approved / rejected | Teacher | (see Module 16 §16) | `gc://teacher/verification` | verification | No (approval is urgent — see M16) |
| Review received | Teacher | "New review" / "{rating}★ — \"{comment}…\"" | `gc://teacher/reviews/:id` | reviews | No |
| Subscription/boost expiring (7/3/1 days) | Teacher | "Your {planName} listing expires soon" / "{n} days left. Renew to keep your premium placement." | `gc://plans` | subscription | No |
Every row here is filtered through this module's preferences (BR-20.1–20.3) before Module 0's worker sends it; a category with `pushEnabled: false` still writes the `user_notifications` inbox row (Module 48 still shows it) but skips the FCM send (`push_status = 'skipped_pref'`).

## [M21](modules/M21-institute-registration.md) Institute Registration

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Draft not submitted 24 h, 72 h, 7 days after registration | Primary manager | "Finish verifying Apex JEE Academy" / "Upload your documents so parents can find you." | `/institute/documents` | verification | No |
| Invited staff joined (sent by this module, template owned by M24) | Inviter and primary manager | "Kavita Rao joined your team" / "They can now answer enquiries as Counsellor." | `/institute/staff` | account | No |

Registration itself sends no push (the device is registered only after sign-in); the owner gets a welcome email when an email is present. Reminders stop as soon as the institute leaves `draft`.

## [M22](modules/M22-institute-verification.md) Institute Verification

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Submitted / resubmitted | All active managers | In-app only: "Application submitted" / "We'll check your documents within 48 hours." | `/institute/verification` | verification | No |
| Documents requested (Admin M22 FR-22.4; also SMS + email) | All active managers | "Action needed for Apex JEE Academy" / "Please re-upload: Registration certificate." | `/institute/documents` | verification | No |
| Visit scheduled / rescheduled (Admin M23) | All active managers | "Evaluation visit on Tue, 29 Sep" / "Site visit at 11:00 AM. Tap to see what to prepare." | `/institute/verification` | verification | No |
| Visit tomorrow (reminder job) | All active managers | "Evaluation visit tomorrow" / "11:00 AM at your campus. Keep the test hall and fire exits accessible." | `/institute/verification` | verification | No |
| Approved (Admin M23) | All staff | "Apex JEE Academy is verified" / "Your GuruConnect rating is 4.5. Parents can now find you." | `/institute/verification` | verification | Yes |
| Rejected (Admin M23) | All active managers | "Application not approved" / "Tap to see the reason and next steps." | `/institute/verification` | verification | No |
| Badge revoked / listing suspended (Admin M23/M24) | All staff | "Your listing is paused" / "Contact support to know more." | `/institute/verification` | account | Yes |
| Docs requested reminder 48 h / 5 days | All active managers | "Your application is waiting" / "Re-upload the requested documents to continue." | `/institute/documents` | verification | No |
Admin-triggered events are sent through `NotificationService` by the admin services using the templates defined here (`institute.docs_requested`, `institute.visit_scheduled`, …).

## [M23](modules/M23-institute-dashboard.md) Institute Dashboard

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Weekly summary (Mon 10:00 IST) | Active managers of approved institutes with activity | "Your week on GuruConnect" / "142 profile views and 9 enquiries last week. Response rate 83%." | `/institute/dashboard` | account | No |
| Response rate below 50% (weekly check, ≥ 5 enquiries) | Active managers | "Parents are waiting" / "Only 4 of 10 enquiries got a reply within a day. Faster replies rank you higher." | `/institute/enquiries` | leads | No |
Enquiry, review and verification pushes are defined by M39, M35 and M22.

## [M24](modules/M24-institute-manager.md) Institute Manager

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Invited staff joined (M21 inserts the row; this module owns the template) | Inviter and primary manager | "Kavita Rao joined your team" / "They can now answer enquiries as Counsellor." | `/institute/staff` | account | No |
| Your role changed | The affected staff member | "Your role changed" / "You're now a Manager at Apex JEE Academy." | `/institute/staff` | account | No |
| Your access was removed | The disabled staff member (best-effort, device may already be signed out) | "Your access was removed" / "You no longer have access to Apex JEE Academy." | — (in-app inbox only) | account | No |
| Profile change needs a reason review | none — internal only, no push | — | — | — | — |

## [M25](modules/M25-institute-teacher-management.md) Institute Teacher Management

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Link request sent | Teacher (if a device is registered) | "Apex JEE Academy wants to list you" / "Confirm or decline in 2 taps." | `/teacher/institute-invites` | account | No |
| Link accepted | Requesting manager and primary manager | "Imran Qureshi confirmed" / "He's now listed as verified faculty." | `/institute/teachers` | account | No |
| Link declined | Requesting manager | "Request declined" / "Imran Qureshi declined the link request." | `/institute/teachers` | account | No |
| Teacher limit reached on accept | Primary manager | "Teacher limit reached" / "Remove a teacher or contact us to add more than 25." | `/institute/teachers` | account | No |

## [M26](modules/M26-institute-rating-display.md) Institute Rating Display

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| New GuruConnect rating submitted (Admin M27 FR-27.3) | All active managers | "Your GuruConnect rating is 4.5" / "Read what our evaluator noted about Apex JEE Academy." | `/institute/rating` | verification | No |
| Re-evaluation due in 14 days (Admin M27 FR-27.6, informational) | Primary manager | "Your next evaluation is coming up" / "GuruConnect will re-evaluate Apex JEE Academy around 14 Aug 2027." | `/institute/rating` | verification | No |

## [M29](modules/M29-advanced-filters.md) Advanced Filters

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Daily alert has new matches | Saved search owner | "3 new matches for 'HSR maths tutors'" / "New teachers were just approved near you." | `/search/results?savedSearchId=…` | recommendations | No |

## [M34](modules/M34-teacher-reviews.md) Teacher Reviews

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `review_published` | Author | "Your review is live" / "Thanks, {firstName}! Your review of {teacherName} is now on their profile." | `/me/reviews` | reviews | No |
| `review_rejected` | Author | "Your review needs a change" / "Your review of {teacherName} wasn't published: {reasonText}" | `/me/reviews` | reviews | No |
| `review_prompt` | Parent / student (BR-34.12) | "How was {teacherName}?" / "Share a quick review to help other parents choose." | `/t/{publicCode}?action=review` | reviews | No |

The two moderation events are emitted by the Admin M35 decision service and the auto-moderation job; this module owns their templates and deep-link handling. Teacher-side review events are listed in M36. In-app only: none.

## [M35](modules/M35-institute-reviews.md) Institute Reviews

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `institute_review_published` | Author | "Your review is live" / "Your review of {instituteName} is now on its profile." | `/me/reviews` | reviews | No |
| `institute_review_rejected` | Author | "Your review needs a change" / "Your review of {instituteName} wasn't published: {reasonText}" | `/me/reviews` | reviews | No |
| `institute_review_new` | All active staff of the institute | "New {rating}★ review" / "{authorName} reviewed {instituteName}. Tap to reply." | `/institute/reviews/{reviewId}` | reviews | No |
| `institute_reply_approved` | Staff member who wrote the reply | "Your reply is live" / "Your reply to {authorName}'s review is now public." | `/institute/reviews/{reviewId}` | reviews | No |
| `institute_reply_rejected` | Staff member who wrote the reply | "Reply not published" / "{reasonText} Edit and post again." | `/institute/reviews/{reviewId}` | reviews | No |
| `review_prompt` (institute) | Learner (BR-34.12) | "How was {instituteName}?" / "Rate teaching, facilities and safety in a minute." | `/i/{slug}?action=review` | reviews | No |

## [M36](modules/M36-teacher-reply-to-review.md) Teacher Reply To Review

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `teacher_review_new` | Teacher | "New {rating}★ review" / "{authorName}: “{first 60 chars}” Tap to reply." | `/teacher/reviews/{reviewId}` | reviews | No |
| `teacher_review_edited` | Teacher (after the edited review is re-published) | "A review was updated" / "{authorName} edited their review. Check your reply still fits." | `/teacher/reviews/{reviewId}` | reviews | No |
| `teacher_reply_approved` | Teacher | "Your reply is live" / "Your reply to {authorName} is now on your profile." | `/teacher/reviews/{reviewId}` | reviews | No |
| `teacher_reply_rejected` | Teacher | "Reply not published" / "{reasonText}" | `/teacher/reviews/{reviewId}` | reviews | No |

All four are emitted by the Admin M35 pipeline/decision service; this module owns templates and routing. Low ratings are not sent at a different urgency.

## [M37](modules/M37-contact-teacher.md) Contact Teacher

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `lead_new` | Teacher | "New request from {requesterName}" / "{className} · {subject} · {leadTypeLabel}. Reply within 24 h." | `/leads/{leadId}` | leads | No (high-importance `leads` channel) |
| `lead_unviewed_reminder` | Teacher (2 h after, still `new`) | "{requesterName} is waiting" / "Reply to keep your response rate high." | `/leads/{leadId}` | leads | No |
| `lead_message` | Other side | "{senderName}" / "{message preview, masked if locked}" | `/leads/{leadId}` | leads | No |
| `lead_contact_unlocked` | Teacher | "Contact shared" / "{requesterName}'s number is now visible. Call them back." | `/leads/{leadId}` | leads | No |
| `lead_declined` | Requester | "{teacherName} can't take this request" / "{reasonCopy} See similar teachers." | `/leads/{leadId}` | leads | No |
| `lead_converted` | Teacher (when the requester marks it) | "Classes started with {requesterName}" / "Congratulations! Ask them for a review after a few classes." | `/leads/{leadId}` | leads | No |

In-app inbox only: `lead_viewed` (requester: "{teacherName} saw your request"), `lead_auto_closed` (requester). SMS (not push): `lead_new_sms` to the teacher after 30 min unviewed, template "GuruConnect: {requesterName} requested {subject} classes. Open the app to reply: https://guruconnect.in/leads/{leadId}".

## [M38](modules/M38-demo-class-request.md) Demo Class Request

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `demo_requested` | Teacher / institute staff | "New demo request" / "{requesterName} wants a demo for {subject}, {classLabel}." | `/demos/{id}` | demos | No |
| `demo_confirmed` | Requester | "Demo confirmed" / "{targetName} confirmed {date} at {time}." | `/demos/{id}` | demos | No |
| `demo_reschedule_proposed` | Other side | "New time proposed" / "{proposerName} proposed {date} at {time}." | `/demos/{id}` | demos | No |
| `demo_reschedule_accepted` | Proposer | "New time accepted" / "Your demo is now {date} at {time}." | `/demos/{id}` | demos | No |
| `demo_reminder` | Both sides | "Demo in 1 hour" / "{targetName} · {date} at {time}. Tap to join." | `/demos/{id}` | demos | Yes |
| `demo_cancelled` | Other side | "Demo cancelled" / "{cancellerName} cancelled: {reason}" | `/demos/{id}` | demos | No |
| `demo_expired` | Requester | "No confirmation yet" / "{targetName} didn't confirm in time. Pick another slot." | `/demos/{id}` | demos | No |
| `demo_no_show` | Reported side | "Marked as a no-show" / "For {date}. Contact support if this is wrong." | `/demos/{id}` | demos | No |
| `demo_outcome_prompt` | Both sides (2 h after completion, if not yet recorded) | "How did the demo go?" / "Let us know so we can keep recommendations useful." | `/demos/{id}?action=outcome` | demos | No |

In-app inbox only: none beyond the pushes above.

## [M39](modules/M39-contact-institute.md) Contact Institute

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `institute_enquiry_new` | All active staff of the institute | "New enquiry" / "{requesterName} asked about {subject}, {classLabel}." | `/institute/enquiries/{id}` | leads | No |
| `institute_enquiry_assigned` | The assigned staff member (if also a registered teacher with a device) | "An enquiry was assigned to you" / "{requesterName} · {subject}. Reply within 24 h." | `/institute/enquiries/{id}` | leads | No |
| `institute_enquiry_unviewed_reminder` | All active staff (2 h after, still `new`) | "An enquiry is waiting" / "Reply to keep your response rate high." | `/institute/enquiries/{id}` | leads | No |

Messaging, call and unlock pushes reuse M37's `lead_message`/`lead_contact_unlocked` templates unchanged; declined/converted pushes to the requester reuse M37's `lead_declined`/`lead_converted`.

## [M40](modules/M40-favorite-teachers.md) Favorite Teachers

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `favorite_teacher_verified` | User (favourited this teacher) | "{teacherName} is now verified" / "One of your saved teachers just completed GuruConnect verification." | `/t/{publicCode}` | recommendations | No |
| `favorite_teacher_fees_changed` | User | "{teacherName} updated their fees" / "Check the new plans before you decide." | `/t/{publicCode}` | recommendations | No |
| `favorite_teacher_demos_open` | User | "{teacherName} is accepting demos again" / "Book a free demo now." | `/t/{publicCode}?action=demo` | recommendations | No |

## [M41](modules/M41-favorite-institutes.md) Favorite Institutes

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `favorite_institute_verified` | User (favourited this institute) | "{instituteName} is now verified" / "One of your saved institutes just completed GuruConnect verification." | `/i/{slug}` | recommendations | No |
| `favorite_institute_rating_changed` | User | "{instituteName}'s rating updated" / "Its GuruConnect rating is now {rating}." | `/i/{slug}` | recommendations | No |
| `favorite_institute_batch_open` | User (child needs that subject) | "New batch open at {instituteName}" / "{seats} seats open in {subject}." | `/i/{slug}?tab=batches` | recommendations | No |

## [M42](modules/M42-trust-score-display.md) Trust Score Display

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `trust_score_frozen` | Teacher | "Your score is paused" / "GuruConnect is reviewing an account matter. This doesn't affect how your profile looks to families." | `/teacher/trust-score` | verification | No |
| `trust_score_unfrozen` | Teacher | "Your score is active again" / "GuruConnect finished its review." | `/teacher/trust-score` | verification | No |
| `trust_score_overridden` | Teacher | "Your score was adjusted" / "GuruConnect set your score to {overrideScore} until {date}." | `/teacher/trust-score` | verification | No |

In-app inbox only: none. Ordinary factor movement (a review published, a document approved) does not push from this module — it pushes from the module that owns that event (M34, M16).

## [M43](modules/M43-payment-gateway.md) Payment Gateway

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `payment.captured` | Payer | "Payment successful" / "₹199 received for Parent membership · Monthly. Receipt TXN-7702140." | `gc://payments/<id>` | payments | yes (user just paid) |
| `payment.failed` | Payer | "Payment failed" / "Your ₹199 payment didn't go through. If money was debited, it will be refunded in 5–7 days." | `gc://payments/<id>` | payments | yes |
| `payment.late_captured` | Payer | "Payment confirmed" / "Your bank confirmed ₹199. Your membership is now active." | `gc://payments/<id>` | payments | no |

In-app only: none. The push `data.entityId` is the transaction id; `PaymentResult` listens for it in the foreground and stops polling when it arrives.

## [M44](modules/M44-subscriptions.md) Subscriptions

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `subscription.trial_ending` | Parent/student in trial, 2 days before end | "Your free trial ends in 2 days" / "Continue with membership from ₹299/month to keep contacting teachers." | `gc://plans` | subscription | no |
| `subscription.renewal_reminder` | Live row, 7 days before `ends_at` | AutoPay: "₹299 will be charged on 26 Oct" / "Your membership renews automatically." · Manual: "Your membership ends on 26 Oct" / "Renew to keep access." | `gc://subscriptions` | subscription | no |
| `subscription.renewed` | AutoPay charge captured | "Membership renewed" / "₹299 charged. Active till 25 Nov." | `gc://subscriptions` | subscription | no |
| `subscription.renewal_failed` | Charge failed, grace started | "Renewal payment failed" / "Pay by 29 Oct to keep your membership." | `gc://subscriptions` | subscription | yes |
| `subscription.expired` | Row expired | "Your membership has ended" / "Renew any time to contact teachers again." | `gc://plans` | subscription | no |
| `subscription.autopay_on` | Mandate confirmed | "AutoPay is on" / "Next charge ₹299 on 26 Oct." | `gc://subscriptions` | subscription | no |
| `subscription.autopay_off` | Turned off in app or revoked in UPI app | "AutoPay turned off" / "Your membership ends on 26 Oct unless you renew." | `gc://subscriptions` | subscription | no |
| `subscription.autopay_reauth` | Price rose above the mandate limit | "Please set up AutoPay again" / "The new price is ₹349/month. Approve AutoPay again to keep renewing automatically." | `gc://subscriptions` | subscription | no |
| `subscription.registration_expiring` | Teacher / institute managers, 30, 7, 1 days before | "Registration ends in 7 days" / "Renew for ₹499 to stay in search results." | `gc://subscriptions` | subscription | no |
| `subscription.registration_expired` | Same | "Your registration has ended" / "Renew within 7 days to keep appearing in search." | `gc://subscriptions` | subscription | no |
| `subscription.boost_expiring` | Teacher, 3 days before end | "Premium ends on 20 Oct" / "Extend to stay at the top of search results." | `gc://teacher/boosts` | subscription | no |
| `subscription.boost_expired` | Teacher | "Featured listing ended" / "Your profile is no longer on the home screen." | `gc://teacher/boosts` | subscription | no |
| `subscription.free_access` | Users moved to `free_access` (Admin M41 FR-41.5) | "Membership is free for now" / "Enjoy full access at no cost." | `gc://subscriptions` | subscription | no |
| `subscription.admin_changed` | Admin grant / extend / cancel (Admin M41 FR-41.6) | "Your plan was updated" / "Extended by 7 days — now active till 2 Nov." | `gc://subscriptions` | subscription | no |

In-app only: `subscription.cancelled` confirmation ("Membership cancelled. Access till 25 Oct.") and `subscription.resumed`.

## [M45](modules/M45-payment-history.md) Payment History

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `payment.refund_processed` | Payer | "Refund completed" / "₹199 refunded to your original payment method for TXN-7702140." | `gc://payments/<id>` | payments | no |
| `payment.refund_denied` | Payer | "Refund request declined" / "<denialReason>" | `gc://payments/<id>` | payments | no |
| `payment.refund_failed` | Payer | "Refund couldn't be processed" / "We're retrying your ₹199 refund for TXN-7702140." | `gc://payments/<id>` | payments | no |

In-app only: the "Refund requested" confirmation toast right after submit. `payment.captured`/`payment.failed`/`payment.late_captured` are M43's events, not repeated here.

## [M46](modules/M46-referral-system.md) Referral System

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| `referral.qualified` | Referrer | "Your friend is in!" / "Priya just subscribed. Your ₹100 reward unlocks on 3 Oct." | `gc://referrals` | referral | no |
| `referral.rewarded` | Referrer | "₹100 credited to your wallet" / "Thanks for inviting Priya — your reward is ready to use." | `gc://wallet` | referral | no |
| `referral.referee_bonus` | Referee | "₹100 welcome credit added" / "Your referral bonus is in your wallet — use it on your next payment." | `gc://wallet` | referral | no |
| `referral.reversed` | Whoever held the reversed credit | "A referral reward was reversed" / "One of your wallet credits was reversed after a review. Contact support if this looks wrong." | `gc://wallet` | referral | no |

In-app only: the "Code applied" confirmation inline on `ApplyCodeSheet`. `on_hold`/fraud review sends no push (it would reveal the review to a bad actor); the referrer simply keeps seeing "Invited" until it resolves.

## [M47](modules/M47-push-notifications.md) Push Notifications

The full catalogue — every push-sending event defined anywhere in this spec pack, so any two modules share categories, tone and urgency consistently. Full title/body copy and firing conditions live in the "Defined in" module; this table is the index.

| Event | Category | Recipient | Urgent | Defined in |
| --- | --- | --- | --- | --- |
| Password changed | account | Self | yes | M04 |
| Signed out everywhere (token reuse) | account | Self | yes | M04 |
| New device signed in | account | Self | no | M04 |
| `student.parental_consent_confirmed` | account | Student | no | M11 |
| `student.parental_consent_declined` | account | Student | yes | M11 |
| Invited staff joined | account | Inviter, primary manager | no | M21, M24 |
| Your role changed | account | Affected staff member | no | M24 |
| Your access was removed | account | Affected staff member (in-app only) | no | M24 |
| Weekly performance summary | account | Institute managers | no | M23 |
| Badge revoked / listing suspended | account | All institute staff | yes | M22 |
| Phone changed | account | Self | no | M51 |
| Email changed | account | Self | no | M51 |
| Password set/changed (from Settings) | account | Self | no | M51 |
| Google account linked/unlinked | account | Self | no | M51 |
| Registration submitted | verification | Teacher | no | M15 |
| Document approved | verification | Teacher | no | M16 |
| Re-upload requested | verification | Teacher | no | M16 |
| Application approved | verification | Teacher | yes | M16 |
| Application rejected | verification | Teacher | no | M16 |
| Draft not submitted reminder (24 h/72 h/7 d) | verification | Primary manager | no | M21 |
| Application submitted/resubmitted | verification | All institute managers (in-app only) | no | M22 |
| Documents requested | verification | All institute managers | no | M22 |
| Evaluation visit scheduled/rescheduled | verification | All institute managers | no | M22 |
| Evaluation visit tomorrow | verification | All institute managers | no | M22 |
| Institute approved | verification | All institute staff | yes | M22 |
| Institute rejected | verification | All institute managers | no | M22 |
| Docs-requested reminder (48 h/5 d) | verification | All institute managers | no | M22 |
| `lead_new` | leads | Teacher | no (`leads` channel is high-importance) | M37 |
| `lead_unviewed_reminder` | leads | Teacher | no | M37 |
| `lead_message` | leads | Other side of the conversation | no | M37 |
| `lead_contact_unlocked` | leads | Teacher | no | M37 |
| `lead_declined` | leads | Requester | no | M37 |
| `lead_converted` | leads | Teacher | no | M37 |
| `institute_enquiry_new` | leads | All active institute staff | no | M39 |
| `institute_enquiry_assigned` | leads | Assigned staff member | no | M39 |
| `institute_enquiry_unviewed_reminder` | leads | All active institute staff | no | M39 |
| Response rate below 50% | leads | Institute managers | no | M23 |
| `demo_requested` | demos | Teacher / institute staff | no | M38 |
| `demo_confirmed` | demos | Requester | no | M38 |
| `demo_reschedule_proposed` | demos | Other side | no | M38 |
| `demo_reschedule_accepted` | demos | Proposer | no | M38 |
| `demo_reminder` (1 hour before) | demos | Both sides | yes | M38 |
| `demo_cancelled` | demos | Other side | no | M38 |
| `demo_expired` | demos | Requester | no | M38 |
| `demo_no_show` | demos | Reported side | no | M38 |
| `demo_outcome_prompt` | demos | Both sides | no | M38 |
| `review_published` / `review_rejected` | reviews | Author | no | M34 |
| `review_prompt` (teacher) | reviews | Learner | no | M34 |
| `institute_review_published` / `_rejected` | reviews | Author | no | M35 |
| `institute_review_new` | reviews | All active institute staff | no | M35 |
| `institute_reply_approved` / `_rejected` | reviews | Reply author | no | M35 |
| `review_prompt` (institute) | reviews | Learner | no | M35 |
| `teacher_review_new` / `_edited` | reviews | Teacher | no | M36 |
| `teacher_reply_approved` / `_rejected` | reviews | Teacher | no | M36 |
| `payment.captured` | payments | Payer | yes | M43 |
| `payment.failed` | payments | Payer | yes | M43 |
| `payment.late_captured` | payments | Payer | no | M43 |
| `payment.refund_processed` | payments | Payer | no | M45 |
| `payment.refund_denied` | payments | Payer | no | M45 |
| `payment.refund_failed` | payments | Payer | no | M45 |
| `subscription.trial_ending` | subscription | Parent/student in trial | no | M10, superseded by M44 |
| `subscription.renewal_reminder` | subscription | Live-plan holder | no | M10, M44 |
| `subscription.renewal_failed` (alias `grace_started`, M10) | subscription | Live-plan holder | yes | M44 |
| `subscription.renewed` | subscription | AutoPay holder | no | M44 |
| `subscription.expired` | subscription | Expired-plan holder | no | M10, M44 |
| `subscription.free_access` (alias `moved_to_free_access`, M10) | subscription | Affected users | no | M44 |
| `subscription.autopay_on` / `_off` / `_reauth` | subscription | Parent/student | no | M44 |
| `subscription.registration_expiring` / `_expired` | subscription | Teacher / institute managers | no | M44 |
| `subscription.boost_expiring` / `_expired` | subscription | Teacher | no | M44 |
| `subscription.admin_changed` | subscription | Affected user | no | M44 |
| `referral.qualified` | referral | Referrer | no | M46 |
| `referral.rewarded` | referral | Referrer | no | M46 |
| `referral.referee_bonus` | referral | Referee | no | M46 |
| `referral.reversed` | referral | Whoever held the credit | no | M46 |
| Daily saved-search alert | recommendations | Saved-search owner | no | M29 |
| `favorite_teacher_verified` | recommendations | User who favourited | no | M40 |
| `favorite_teacher_fees_changed` | recommendations | User who favourited | no | M40 |
| `favorite_teacher_demos_open` | recommendations | User who favourited | no | M40 |
| Report acknowledged | complaints | Reporter | no | M49 |
| Information requested | complaints | Reporter or reported party | no | M50 |
| Case resolved/dismissed | complaints | Reporter only | no | M50 |
| Admin campaign (any copy, `campaign_id` set) | announcements | Resolved audience | Super Admin campaigns only | Admin M46 |

Categories not yet exercised by a shipped module (none at this pack's current state) will be added to this same table as those modules are written — the category set itself is fixed (conventions §16) so no new category is invented per feature.

## [M49](modules/M49-report-user.md) Report User

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Report acknowledged | Reporter | "Report received" / "We've received case CS-4471 and will review it soon." | `gc://reports/:id` | complaints | No |
No push is ever sent to the reported party from this module (BR-49.7); any notice they receive about a warning or suspension comes from Admin M43's enforcement pipeline, not from the act of reporting.

## [M50](modules/M50-complaint-history.md) Complaint History

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Information requested | Whichever side (reporter or reported) | "We need more information" / "Reply to case CS-4471 to help us investigate." | `gc://reports/:id` | complaints | No |
| Case resolved/dismissed | Reporter only | "Update on your report" / "There's an update on case CS-4471." | `gc://reports/:id` | complaints | No |
The reported party gets no push when the case is merely created or merely resolved/dismissed (BR-49.6/BR-50.6) — only when their reply is needed or when a separate enforcement notice is sent (owned by Admin M43's pipeline, not this module).

## [M51](modules/M51-account-settings.md) Account Settings

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Phone changed | Self | "Phone number updated" / "Your sign-in number was changed to •••• 0001." | `gc://account` | account | No |
| Email changed | Self | "Email updated" / "Your sign-in email was changed." | `gc://account` | account | No |
| Password set/changed | Self | "Password updated" / "Your password was changed. If this wasn't you, contact support." | `gc://account` | account | No |
| Google linked/unlinked | Self | "Google account linked" / "unlinked" | `gc://account` | account | No |

## [M52](modules/M52-privacy-settings.md) Privacy Settings

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Data export ready | Self | "Your data export is ready" / "Check lakshmi.v@gmail.com for your download link." | `gc://account/privacy` | account | No |
Email is the primary channel for the export link itself (it's a downloadable file, not something to open in-app); the push is a heads-up only.

## [M53](modules/M53-help-support.md) Help & Support

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Support replied | Ticket owner | "Support replied" / "New message on ST-10042." | `gc://support/tickets/:id` | account | No |
| Ticket resolved | Ticket owner | "Your ticket is resolved" / "ST-10042 has been marked resolved. Let us know how we did." | `gc://support/tickets/:id` | account | No |

## [M54](modules/M54-delete-account.md) Delete Account

| Event | Recipient | Title / Body | Deep link | Category | Urgent |
| --- | --- | --- | --- | --- | --- |
| Deletion scheduled | Self | "Account scheduled for deletion" / "Your account will be deleted on 26 Oct 2026. Tap to cancel." | `gc://account/deletion` | account | No |
| Deletion reminder (T-3 days) | Self | "3 days until account deletion" / "Cancel anytime before 26 Oct 2026." | `gc://account/deletion` | account | No |
| Deletion cancelled | Self | "Deletion cancelled" / "Your account is safe. Welcome back." | `gc://account` | account | No |
Execution's final confirmation is email-only, sent by the job before the row is scrubbed (no device to push to by then).

