# Platform 130 Gap Matrix

Status legend:
- **DONE** = implemented and verified in current repo/CI
- **PARTIAL** = implemented in part, or wired but not production-complete
- **MISSING** = not implemented or not wired

Last updated: 2026-05-13

## 1–14
1. Port/process stability (3001/3002 conflict handling) — **PARTIAL**
2. Campaign selector refresh stale cache — **PARTIAL**
3. `.next` corruption hardening — **PARTIAL**
4. Auto clean before run consistency — **PARTIAL**
5. Stage handoff validation — **PARTIAL**
6. Dashboard->agent execution control — **PARTIAL**
7. Stage runtime trigger controls — **PARTIAL**
8. Pause/resume workflow controls — **PARTIAL**
9. Runtime error recovery system — **PARTIAL**
10. Campaign data stale load after switch — **PARTIAL**
11. Build/cache corruption permanent elimination — **PARTIAL**
12. Deterministic dashboard startup tooling — **DONE**
13. Stage dependency enforcement API — **DONE**
14. Dashboard as read-only limitation removal — **PARTIAL**

## 15–30
15. Model routing visibility/override UI — **PARTIAL**
16. Brain files executable from dashboard — **PARTIAL**
17. End-to-end campaign creation workflow — **PARTIAL**
18. Scripts integrated in dashboard UI — **PARTIAL**
19. Error recovery/readable failures — **PARTIAL**
20. Google Docs export production path — **PARTIAL**
21. Muck Rack integration production path — **PARTIAL**
22. Logging infra (structured/searchable/retention) — **PARTIAL**
23. Validation report display from real JSON — **PARTIAL**
24. Performance metrics (latency/time/cost/tokens) — **PARTIAL**
25. Multi-user auth/roles/team model — **PARTIAL**
26. Backup/restore/export/import campaigns — **PARTIAL**
27. Runtime schema validation enforcement — **PARTIAL**
28. Documentation sync governance — **PARTIAL**
29. Test coverage baseline — **PARTIAL**
30. Centralized environment/config management — **PARTIAL**

## 31–50
31. Real-time updates (SSE/WebSocket) — **PARTIAL**
32. Campaign state machine strictness — **PARTIAL**
33. File locking/atomic read-write protection — **PARTIAL**
34. Data import pipeline (CSV/PDF/XLS/API/RSS) — **PARTIAL**
35. Angle scoring transparency UI — **PARTIAL**
36. Beat matching explainability/override — **PARTIAL**
37. A/B testing result surfacing — **MISSING**
38. Follow-up tracker functional backend — **MISSING**
39. Placement tracker functional backend — **MISSING**
40. Reporting page real data/filters/export — **PARTIAL**
41. Agent fleet live health/restart/logs — **PARTIAL**
42. Settings page full config controls — **PARTIAL**
43. In-app help/docs/tooltips/onboarding — **MISSING**
44. Mobile responsive hardening — **PARTIAL**
45. Keyboard shortcuts/command palette — **MISSING**
46. Deep-link routing/shareable state — **PARTIAL**
47. Export formats (JSON/CSV/PDF/etc.) — **PARTIAL**
48. Campaign templates system — **PARTIAL**
49. Scheduled campaigns/automation windows — **MISSING**
50. API rate-limit/backoff/budget controls (LLM path) — **PARTIAL**

## 51–70
51. Audit trail visualization/search/export — **PARTIAL**
52. Claim ledger enforcement in writing path — **PARTIAL**
53. Context isolation enforcement by stage — **PARTIAL**
54. Circuit-breaker runtime automation — **PARTIAL**
55. Anti-sales rule enforcement — **PARTIAL**
56. CTA softness rule enforcement — **PARTIAL**
57. Data visualization coverage across pages — **PARTIAL**
58. JSON viewer UX (search/collapse/copy) — **PARTIAL**
59. Markdown rendering fidelity — **PARTIAL**
60. Pagination for large lists — **PARTIAL**
61. Global search implementation — **PARTIAL**
62. Bulk actions — **MISSING**
63. Form validation completeness — **PARTIAL**
64. Consistent loading states — **PARTIAL**
65. Unified API error format across routes — **PARTIAL**
66. Notifications system end-to-end — **PARTIAL**
67. Theme customization — **MISSING**
68. Offline mode/resilience — **MISSING**
69. Form draft persistence/auto-save — **PARTIAL**
70. Breadcrumb navigation — **MISSING**

## 71–90
71. Confirmation dialogs for destructive actions — **PARTIAL**
72. Undo/redo action history — **MISSING**
73. Accessibility/ARIA/focus/contrast — **PARTIAL**
74. File version history/diff/rollback — **MISSING**
75. Templates folder productization — **PARTIAL**
76. Skills folder runtime integration — **PARTIAL**
77. Data folder integration clarity — **PARTIAL**
78. Fixtures usable demo/test mode — **PARTIAL**
79. Staging environment discipline — **PARTIAL**
80. CI/CD pipeline depth (deploy/rollback/version) — **PARTIAL**
81. Campaign comparison analytics — **MISSING**
82. Campaign archiving lifecycle — **PARTIAL**
83. Stage dependency graph visualization — **MISSING**
84. Stage duration tracking trends — **PARTIAL**
85. Cost accumulation reporting — **PARTIAL**
86. Success-rate funnel metrics — **PARTIAL**
87. Persistent journalist database — **MISSING**
88. Email template library — **MISSING**
89. Angle template library — **MISSING**
90. Source library reuse system — **MISSING**

## 91–110
91. Campaign notes/tags/attachments/comments — **PARTIAL**
92. Internal/external visibility flags — **PARTIAL**
93. Template variables/fields workflow — **PARTIAL**
94. Merge/split/duplicate/fork campaigns — **PARTIAL**
95. Webhook system — **MISSING**
96. Public/external API for programmatic access — **PARTIAL**
97. i18n/localization support — **MISSING**
98. Timezone handling consistency — **PARTIAL**
99. Notification preference center — **MISSING**
100. Team collaboration primitives — **PARTIAL**
101. Campaign sharing + permissions — **PARTIAL**
102. Activity feed — **PARTIAL**
103. Favorites/quick access system — **MISSING**
104. Dashboard customization/widgets — **MISSING**
105. Browser extension ecosystem — **MISSING**
106. Mobile app — **MISSING**
107. CLI tool — **PARTIAL**
108. Embeddable widgets — **MISSING**
109. PDF generation/export coverage — **PARTIAL**
110. CSV export coverage — **PARTIAL**

## 111–130
111. Image/media export pipeline — **MISSING**
112. Calendar integration — **MISSING**
113. Slack integration — **MISSING**
114. Email integration/send+tracking — **PARTIAL**
115. CRM integration — **MISSING**
116. Analytics integration — **PARTIAL**
117. Social media integration — **MISSING**
118. News API integration — **MISSING**
119. PR database integration breadth — **PARTIAL**
120. IP attribution/privacy tracking governance — **PARTIAL**
121. Cookie banner/consent logging — **MISSING**
122. GDPR operational tooling — **MISSING**
123. Security headers policy — **PARTIAL**
124. HTTPS enforcement/HSTS policy — **PARTIAL**
125. API rate limiting (global abuse protection) — **DONE**
126. Input sanitization hardening — **PARTIAL**
127. CSRF protection policy — **PARTIAL**
128. SQL injection prevention posture — **PARTIAL**
129. API authentication baseline — **DONE**
130. Session management model — **PARTIAL**

---

## Verified recently as DONE in this codebase
- Global mutation auth middleware + request-id propagation + API abuse rate-limit guardrails
- CI guardrail suite (`verify:ci`) including build
- Integration contract smoke checks (health + preflight modes)
- Brain worker service catalog + runtime worker launch path
- Observability summary API and dashboard page
- Release-gate workflow for tagged builds

## Suggested next closure order (highest impact)
1. Multi-user/session model completion (25, 92, 100, 101, 130)
2. External production integrations hardening with deployed creds (20, 21, 112–119)
3. Privacy/compliance/security completion (121, 122, 123, 124, 126, 127)
4. Operational analytics and lifecycle depth (24, 84, 85, 86, 82, 81)
5. UX/productivity completion (43, 45, 62, 67, 70, 72, 103, 104)

