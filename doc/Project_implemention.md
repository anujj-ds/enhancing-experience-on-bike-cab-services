# RideEase — CIA III Project Implementation Work Log

**Project:** RideEase — a ride-hailing web app with real road-based routing, live fare estimation, AI-powered chat translation (rider ↔ driver), and a simulated route-deviation / SOS safety layer.


## 1. Team Responsibilities

| Member | Primary responsibilities |
|---|---|
| Amritha | Firewall / network security; security mechanisms for the API layer; failure & recovery (application/server and network); security testing/evidence; shared integration, testing and documentation work |
| Anuj | Backend/database; ride & fare data schema and diagram; database relationships/queries; ride booking & history CRUD; business transactions (ride lifecycle); fare & driver-matching ranking algorithm; API–database integration; query/transaction optimisation; shared integration, testing and documentation work |
| Riya | Component 11 backend; Gemini-powered chat-translation service; translation API integration/validation; API error handling/logging; Component 14 technical improvement; individual technical evidence; shared integration, testing and documentation work |
| Nayana | Authentication; frontend–backend integration; encryption/data protection; authorization/security controls; failure & recovery (storage/security); Component 14 encryption/auth enhancement; integration testing/bug fixing; quantitative scalability calculations; shared integration, testing and documentation work |
| Arunima | Architecture/component map; draw.io architecture and data flow; frontend (map, booking, chat, SOS UI); route-deviation UX; ride-history frontend UX; Component 14 responsive UI enhancement; shared integration, testing and documentation work |

## 2. Status Definitions

| Status | Meaning |
|---|---|
| Pending | Task identified but development has not started. |
| In Progress | Development has started but the task is not complete. |
| Completed | Implementation is complete and has been verified. |
| Blocked | Development cannot proceed because of a documented technical dependency or problem. |
| Reopened | A previously completed task has been found to contain a problem and requires additional work. |

## 3. Implementation Plan

| Mission | Start | End | Days | Primary Owners | Key Output / Definition of Done | Dependencies | Status | GitHub / Evidence |
|---|---|---|---:|---|---|---|---|---|
| **M01 — Setup + Traceability** | 19 Aug | 19 Aug | 1 | Everyone | GitHub structure ready; `docs/` folder present; `project-implementation.md` and team tracker started. | None | Pending | Repo link / initial commit |
| **M02 — Architecture + Data Design** | 2 Sep | 4 Sep | 3 | Arunima + Anuj | Architecture map, draw.io, booking/chat sequence diagrams and ride-data design agreed. | M01 | In Progress | Diagram / database evidence |
| **M03 — Backend Foundation** | 3 Sep | 6 Sep | 4 | Anuj + Riya | Core Flask API (`/api/estimate-fare`, `/api/translate`, `/api/sos`), Component 11 backend and database connectivity are runnable. | M02 | Pending | Commits + API/database tests |
| **M04 — Frontend Foundation** | 3 Sep | 6 Sep | 4 | Arunima | Core UI, map + booking panel, navigation and trip-tracking view are working. | M02 | Pending | Screenshots + commit |
| **M05 — Authentication + Security Base** | 5 Sep | 8 Sep | 4 | Nayana + Amritha | Authentication, authorization, encryption and firewall/network controls attached to the design. | M03 + M04 | Pending | Security configuration/tests |
| **M06 — Custom Features Sprint** | 7 Sep | 11 Sep | 5 | Arunima + Riya + Anuj | Real road routing, Gemini chat translation, route-deviation alert, ride-history CRUD and fare/ranking algorithm work end-to-end. | Riya + Arunima + Nayana | Pending | Feature demos + commits |
| **M07 — Full Integration** | 10 Sep | 13 Sep | 4 | Everyone | Interface → application logic → data → output works for the main booking and chat workflows. | M06 | Pending | Working demo + API/DB evidence |
| **M08 — Failure + Recovery Drill** | 12 Sep | 14 Sep | 3 | Amritha + Anuj + Nayana | Application/server, database, network, storage and security failures documented with detection/recovery actions. | M07 | Pending | Test results + recovery notes |
| **M09 — Scalability + Quantitative Analysis** | 14 Sep | 16 Sep | 3 | Nayana + Arunima | 1M/5M scaling architecture plus required calculations and interpretations completed (builds on existing Scalability Analysis doc). | M07 | Pending | Calculations + architecture |
| **M10 — Documentation + Worklog Audit** | 15 Sep | 17 Sep | 3 | Everyone | `architecture.md` and `project-implementation.md` current; significant tasks have status and evidence. | All build work | Pending | `docs/` commits |
| **M11 — Final Testing + Viva Prep** | 16 Sep | 17 Sep | 2 | Everyone | Working demo rehearsed; each student can locate and explain their implementation. | M08 | Pending | Demo checklist + evidence |
| **M12 — Report + Final Freeze** | 17 Sep | 18 Sep | 2 | Everyone | Final report assembled; required technical sections checked; regression check complete. | M10 + M11 | Pending | Final repo state + report |

## 4. Official Work Log

| Task ID | Task | Component | Assigned To | Status | Completed By | Date Completed | AI Assistance | GitHub? | Evidence / Commit / File | Notes / Acceptance Criteria |
|---|---|---|---|---|---|---|---|---|---|---|
| T001 | Architecture & Component Map | Architecture | Arunima | Pending | — | — | No | No | — | Define business problem, target users, major components and technology mapping. |
| T002 | Current System Architecture Diagram | Architecture | Arunima | Pending | — | — | No | No | — | Create the draw.io architecture diagram (frontend / Flask backend / OSRM / Gemini). |
| T003 | Data Flow / Sequence Diagrams | Architecture | Arunima | Pending | — | — | No | No | — | Map Interface → Application Logic → Data Layer → Business Output for the booking and chat-translation flows. |
| T004 | Frontend Base Structure & Navigation | Frontend | Arunima | Pending | — | — | No | No | — | Build top nav, side panel and routing between booking/trip views. |
| T005 | Interactive Map & Real Road Routing UI | Frontend / Feature | Arunima | Pending | — | — | No | No | — | Leaflet map, pickup/drop markers, OSRM route polyline and fare card. |
| T006 | Chat, Deviation Alert & SOS UX | Frontend / Feature | Arunima | Pending | — | — | No | No | — | Build chat modal, route-deviation banner and SOS modal with clear status feedback. |
| T007 | Ride History / Past Rides Frontend UX | Frontend / Feature | Arunima | Pending | — | — | No | No | — | Add a ride-history view (cancelled/completed rides) with restore/clear-style actions, mirroring a Recycle-Bin UX pattern. |
| T008 | Component 14: Responsive Theme/UI Enhancement | Component 14 | Arunima | Pending | — | — | No | No | — | Individual technical enhancement to the responsive layout/theme; verify independently. |
| T009 | Database Schema — 6+ Core Entities | Database | Anuj | Pending | — | — | No | No | — | Design persistent schema: Users, Rides, Drivers, Fare_Records, Chat_Messages, Driver_Locations, SOS_Events. |
| T010 | ER / Database Diagram | Database | Anuj | Pending | — | — | No | No | — | Create ER/database diagram and keep it aligned with implementation. |
| T011 | Database Relationships & Queries | Database | Anuj | Pending | — | — | No | No | — | Implement meaningful relationships and queries for users, rides, drivers, fares and chat messages. |
| T012 | Ride Booking & History CRUD | Database / Feature | Anuj | Pending | — | — | No | No | — | Implement create/read/update/cancel for rides, including soft-delete/restore of cancelled trips. |
| T013 | Core Backend/API Layer | Backend | Anuj | Pending | — | — | No | No | — | Extend `app.py` (`/api/estimate-fare`, `/api/translate`, `/api/sos`) into a persistent, database-backed API layer. |
| T014 | Business Transactions — Ride Lifecycle | Business Logic | Anuj | Pending | — | — | No | No | — | Implement the ride state machine: requested → confirmed → in progress → completed / cancelled, with valid transitions enforced. |
| T015 | Fare & Driver-Matching Ranking Algorithm | Business Algorithm | Anuj | Pending | — | — | No | No | — | Extend the flat fare formula into a non-trivial ranking/pricing algorithm (e.g. distance, duration, demand); document inputs, processing and outputs. |
| T016 | API ↔ Database Integration | Integration | Anuj | Pending | — | — | No | No | — | Connect backend APIs to persistent storage and verify end-to-end data operations. |
| T017 | Component 14: Database Query/Transaction Optimisation | Component 14 | Anuj | Pending | — | — | No | No | — | Individual technical improvement to query efficiency or transaction validation; verify independently. |
| T018 | Authentication / Identification | Authentication | Nayana | Pending | — | — | No | No | — | Implement rider/driver authentication/identification flow. |
| T019 | Core Frontend ↔ Backend Integration | Implementation / Integration | Nayana | Pending | — | — | No | No | — | Join core booking/chat frontend flows to backend APIs and ensure data is exchanged correctly. |
| T020 | Encryption & Data Protection | Security | Nayana | Pending | — | — | No | No | — | Implement appropriate encryption/data protection for API keys, ride data and chat messages; document the mechanism. |
| T021 | Authorization & Security Controls Integration | Security | Nayana | Pending | — | — | No | No | — | Integrate authentication, authorization and protected operations (e.g. only the assigned rider can view/cancel a ride). |
| T022 | Failure & Recovery — Storage/Security | Failure & Recovery | Nayana | Pending | — | — | No | No | — | Document and test recovery for security or storage-related failure scenarios. |
| T023 | Component 14: Encryption/Auth Technical Enhancement | Component 14 | Nayana | Pending | — | — | No | No | — | Individual technical contribution improving encryption/authentication, with test evidence. |
| T024 | End-to-End Integration Testing & Bug Fixing | Testing / Integration | Nayana | Pending | — | — | No | No | — | Run integration tests, fix technical defects and verify system workflow. |
| T025 | Quantitative Scalability Calculations | Scalability | Nayana | Pending | — | — | No | No | — | Complete required user-growth, peak-concurrency and request-rate calculations with formula, values, result and interpretation (build on the existing Scalability Analysis doc). |
| T026 | Firewall / Network Security | Security | Amritha | Pending | — | — | No | No | — | Design/attach firewall or network controls appropriate to the system architecture (API layer, OSRM/Gemini egress). |
| T027 | Security Mechanisms — 8+ Controls | Security Documentation | Amritha | Pending | — | — | No | No | — | Document at least eight security mechanisms across authentication, authorization, data, network, database, backup, monitoring and password protection. |
| T028 | Failure & Recovery — Application/Server | Failure & Recovery | Amritha | Pending | — | — | No | No | — | Document impact, detection and recovery for application/server failure. |
| T029 | Failure & Recovery — Network | Failure & Recovery | Amritha | Pending | — | — | No | No | — | Document impact, detection and recovery for network failure (e.g. OSRM/Gemini unreachable). |
| T030 | Component 14: Security / Network Test | Component 14 | Amritha | Pending | — | — | No | No | — | Individual test of firewall/network/security behaviour and evidence collection. |
| T031 | Security Verification & Evidence Collection | Security / Evidence | Amritha | Pending | — | — | No | No | — | Collect screenshots, test results, configuration evidence and link to GitHub/files. |
| T032 | Component 11 — Backend Module | Backend / Component 11 | Riya | Pending | — | — | No | No | — | Implement the assigned backend portion for Component 11 with traceable code changes. |
| T033 | Gemini AI Chat-Translation Service | Backend / Feature | Riya | Pending | — | — | No | No | — | Implement/extend the `/api/translate` service that detects language and translates rider ↔ driver messages via Gemini. |
| T034 | Translation API Integration & Validation | Backend / Feature | Riya | Pending | — | — | No | No | — | Connect the translation service to the chat UI and validate translated output (including the "no API key" fallback path). |
| T035 | API Error Handling & Logging | Backend | Riya | Pending | — | — | No | No | — | Add meaningful API validation, error handling and logging for fault diagnosis across all endpoints. |
| T036 | Component 14: AI Translation Technical Improvement | Component 14 | Riya | Pending | — | — | No | No | — | Individual technical improvement to the chat-translation feature; test and record evidence. |
| T037 | Individual Technical Test & Demo Evidence | Testing / Evidence | Riya | Pending | — | — | No | No | — | Prepare proof of personal implementation: commit, file/module, test result or working demonstration. |
| T038 | Cross-Member End-to-End Integration | Integration | Everyone | Pending | — | — | No | No | — | Verify Interface → Application Logic → Data Layer → Business Output across the main booking and chat workflows. |
| T039 | System Testing + Failure Scenarios + Recovery Demo | Testing / Reliability | Everyone | Pending | — | — | No | No | — | Test core workflows, five failure categories and recovery behaviour; record evidence. |
| T040 | `docs/project-implementation.md` Evidence Audit | Documentation / Work Log | Everyone | Pending | — | — | No | No | — | Check that significant tasks have correct task ID, component, owner, status, completion details, AI assistance and evidence. |

## 5. RideEase Feature Traceability

| RideEase feature / requirement | Main task(s) | Primary owner(s) |
|---|---|---|
| Real road routing (Leaflet + OSRM) | T005, T008 | Arunima |
| AI chat translation (Gemini) | T033, T034, T036 | Riya |
| Route-deviation alert & SOS UX | T006 | Arunima |
| Ride history / cancelled rides | T007, T012 | Arunima + Anuj |
| Backend/API | T013, T016, T032, T035 | Anuj + Riya |
| Database | T009–T012, T017 | Anuj |
| Authentication, encryption and authorization | T018, T020, T021, T023 | Nayana |
| Firewall/network security | T026, T029, T030 | Amritha |
| Business transactions and fare/ranking algorithm | T014, T015 | Anuj |
| Failure and recovery | T022, T028, T029, T039 | Everyone |
| Architecture and data flow | T001–T003 | Arunima |
| End-to-end integration | T019, T024, T038 | Nayana + Amritha |
| Scalability / quantitative analysis | T025 | Arunima |

## 6. Individual Evidence Checklist

| Member | Minimum evidence to maintain |
|---|---|
| Amritha | Firewall/network configuration or diagram, security-control documentation, failure/recovery tests, screenshots/commits |
| Anuj | Schema/ER diagram, database scripts/queries, backend/API commits, transaction/algorithm implementation and tests |
| Riya | Component 11 code, Gemini translation service/API, validation/error handling, Component 14 evidence and demo/test result |
| Nayana | Authentication/encryption/authorization implementation, integration tests, scalability calculations, Component 14 evidence |
| Arunima | Architecture/data-flow diagrams, frontend commits, map/booking/chat/SOS UI, Component 14 evidence and screenshots |
