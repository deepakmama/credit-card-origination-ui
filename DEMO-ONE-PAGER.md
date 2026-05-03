# Citizens Credit Card Origination Platform — Post-Demo One-Pager

---

## Overview

A fully functional, **AI-powered credit card origination platform** built for Citizens Bank. The system automates the entire lifecycle — from identity verification and credit decisioning through card issuance and post-issuance servicing — across **9 Spring Boot microservices** and a **React 18 single-page application**.

**Tech Stack:** Java 17 + Spring Boot 2.5.14 + PILOT Framework | React 18 + Vite + Tailwind CSS | PostgreSQL 14 | Drools 7.59 | Claude AI (Haiku)

---

## What We Demonstrated

### 1. Three Card Products — One Platform

| Product | Min Score | Credit Limit | APR | Differentiator |
|---------|-----------|-------------|-----|----------------|
| **Summit Reserve** (Cash Back) | 680+ | $1K–$10K | 18.99–23.99% | Up to 3% cash back rewards |
| **Summit** (Balance Transfer) | 720+ | $2K–$15K | 0% intro 15 mo | Debt consolidation |
| **Amp** (New to Credit) | None | $300–$1K | 25.99–28.99% | Build credit, secured option |

### 2. Automated 6-Step Pipeline

```
SUBMITTED → KYC → FRAUD REVIEW → CREDIT REVIEW → INCOME VERIFIED → CARD ISSUED
                                       ↓
                                 MANUAL REVIEW → Approve / Deny
```

Each step is a dedicated microservice. Decisions are rendered in **under 60 seconds** for automated flows.

### 3. AI-Powered Experiences

| Feature | What It Does |
|---------|-------------|
| **Conversational Apply** | Claude Haiku guides applicants through the full application via natural-language chat |
| **PROVE Identity Prefill** | Phone + last 4 SSN instantly populates applicant data — zero manual entry |
| **Document OCR** | Claude Vision extracts data from uploaded IDs and pay stubs |
| **4 Intelligence Agents** | Real-time anomaly detection across Conversion, CX, Ops, and Underwriting queues |

### 4. Intelligent Command Center — 4 AI Agents

| Agent | Focus | Example Insight |
|-------|-------|----------------|
| **Conversion Intelligence** | Approval/denial rates, near-misses | "15% of denials are within 20 pts of approval — consider co-signer prompt" |
| **Customer Experience** | Stuck apps, repeat denials, activation rate | "3 applications stuck in FRAUD_REVIEW > 1 hour" |
| **Ops Efficiency** | Pipeline bottlenecks, processing time | "40% of apps concentrated at CREDIT_REVIEW — potential bottleneck" |
| **Underwriting Queue** | SLA compliance, aging buckets | "2 manual reviews breaching 48-hour SLA" |

### 5. Drools Rules Engine — Credit Decisioning

Deterministic, auditable rules mapped to Experian credit score and DTI:

- **Score < 680** → Deny (Cash Back) | **Score < 720** → Deny (Balance Transfer)
- **DTI > 50%** → Deny | **DTI 43–50% + borderline score** → Manual Review
- **Score 780+** → Best rates ($10K limit, 18.99% APR)
- Co-signer bonus: +30 pts if co-signer score >= 700

### 6. Post-Issuance Journeys

- Virtual card display with masked number and Mastercard branding
- Authorized user onboarding
- Balance transfer initiation
- Spend controls and autopay configuration
- Welcome journey checklist

### 7. Colleague Tools

| Tool | Purpose |
|------|---------|
| **Review Queue** | Manual underwriting with approve/deny, limit/APR override |
| **Dashboard** | KPIs — approval rate, pipeline funnel, credit score distribution, prefill impact |
| **A/B Testing** | Create experiments with variant allocation, targeting rules, and result tracking |
| **Pre-Approved Offers** | Single + batch offer creation with segment targeting and funnel analytics |
| **Adverse Action Letters** | FCRA-compliant denial explanations, auto-generated |

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                    React 18 Frontend (:5173)                │
│  Apply  │  Chat  │  Dashboard  │  Review  │  AI Agents      │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST / Proxy
┌──────────────────────▼──────────────────────────────────────┐
│              cc-application-service (:8100)                  │
│                  Pipeline Orchestrator                       │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────┘
   │      │      │      │      │      │      │      │
  KYC   Fraud  Credit Income  Card   Auth  Balance PROVE
 :8101  :8102  :8103  :8104  :8105  :8106  :8107  :8108
                  │
              Drools DRL
              (Rules Engine)
```

**9 Microservices** | **9 PostgreSQL Databases** | **PILOT CQRS Pattern**

---

## Key Metrics Demonstrated

| Metric | Value |
|--------|-------|
| Microservices | 9 |
| Frontend Pages | 13 |
| Reusable Components | 17 |
| Pipeline Steps | 6 (automated) |
| Card Products | 3 |
| AI Agents | 4 |
| Credit Rules (DRL) | 15+ |
| Test SSN Scenarios | 8 deterministic |
| Decision Time | < 60 seconds |

---

## Business Value

- **Speed:** Automated decisioning reduces origination from days to seconds
- **Intelligence:** AI agents proactively surface conversion leaks, CX issues, and operational bottlenecks
- **Flexibility:** Drools rules engine allows business-driven policy changes without code deployment
- **Compliance:** Adverse action letters, audit trails, and fraud screening built into every flow
- **Engagement:** Conversational AI and PROVE prefill reduce application abandonment
- **Experimentation:** A/B testing framework enables data-driven product optimization

---

## What's Next

- Production-grade security (OAuth 2.0, encryption at rest)
- Event-driven architecture (Kafka/SNS for async pipeline)
- Real Experian and PROVE API integration
- Mobile-responsive PWA
- Portfolio analytics and risk reporting
- Multi-brand / white-label support

---

*Built on the PILOT Microservice Framework | Citizens Bank Branding | Purple & Gold Theme*
