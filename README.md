# Credit Card Origination System — Frontend

React 18 frontend for the Credit Card Loan Origination System. Built with Vite, Tailwind CSS, and a purple/gold design theme.

**Backend repo:** [credit-card-origination](https://github.com/deepakmama/credit-card-origination)

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| Vite | 4 | Dev server & build |
| Tailwind CSS | 3 | Styling |
| React Router | 6 | Client-side routing |
| Axios | 1 | HTTP client |

---

## Prerequisites

- Node.js 18+
- `cc-application-service` running on port 8100

---

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. API requests to `/api/*` are proxied to `http://localhost:8100/cc-application-service/1.0`.

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page with product overview |
| `/apply` | New Application | Multi-field application form |
| `/thank-you` | Thank You | Submission confirmation |
| `/applications` | Application List | All applications with status badges |
| `/applications/:id` | Application Detail | Full pipeline view + post-issuance actions |

---

## Components

### Core

| Component | Description |
|-----------|-------------|
| `PipelineTracker` | Step-by-step pipeline progress bar. Shows 7 steps for all cards, 8 steps for Balance Transfer (adds Balance Transfer step). Accepts `status` and `isBalanceTransfer` props. |
| `StatusBadge` | Colour-coded badge for all application statuses |
| `IssuedCardPanel` | Animated card visual with card-type-specific design (Summit Reserve, Summit, Amp) |
| `AuthUserPanel` | Form to add an authorized user or skip the step. Shown when `status === CARD_ISSUED`. |
| `BalanceTransferPanel` | Shows transfer details and initiates the transfer. Shown for Balance Transfer cards after the auth user step. |
| `DocumentUploadPanel` | File upload for supporting documents |
| `CardTypeSelector` | Visual card-type picker on the application form |
| `LoadingSpinner` | Full-page loading state |

### Pipeline Steps

| Step | Status key(s) | All cards | BT cards only |
|------|--------------|-----------|---------------|
| 1 Submitted | `SUBMITTED` | ✓ | ✓ |
| 2 KYC | `KYC_REVIEW` | ✓ | ✓ |
| 3 Fraud | `FRAUD_SCREENING` | ✓ | ✓ |
| 4 Credit | `CREDIT_REVIEW` | ✓ | ✓ |
| 5 Income | `INCOME_VERIFICATION` | ✓ | ✓ |
| 6 Card Issued | `CARD_ISSUED` | ✓ | ✓ |
| 7 Auth User | `AUTH_USER_ADDED` / `AUTH_USER_SKIPPED` | ✓ | ✓ |
| 8 Balance Transfer | `BALANCE_TRANSFER_INITIATED` | — | ✓ |

### Status Badge Colours

| Status | Colour |
|--------|--------|
| `SUBMITTED` | Gray |
| `KYC_REVIEW` | Blue |
| `FRAUD_SCREENING` | Amber |
| `CREDIT_REVIEW` | Green |
| `INCOME_VERIFICATION` | Teal |
| `CARD_ISSUED` | Green |
| `DENIED` | Red |
| `MANUAL_REVIEW` | Amber |
| `AUTH_USER_ADDED` | Green |
| `AUTH_USER_SKIPPED` | Gray |
| `BALANCE_TRANSFER_INITIATED` | Blue |

---

## API Functions (`src/api/cardApi.js`)

```js
submitApplication(payload)              // POST /card-application
getApplications()                       // GET  /card-application
getApplication(id)                      // GET  /card-application/:id
reprocessApplication(id, ssn)           // POST /card-application/:id/reprocess
uploadDocument(appId, type, file)       // POST /card-application/:id/documents
getDocuments(appId)                     // GET  /card-application/:id/documents
addAuthUser(appId, data)                // POST /card-application/:id/auth-user
skipAuthUser(appId)                     // POST /card-application/:id/auth-user/skip
initiateBalanceTransfer(appId)          // POST /card-application/:id/balance-transfer
```

---

## Application Detail Page Flow

```
CARD_ISSUED
    │
    ├── IssuedCardPanel (card visual)
    └── AuthUserPanel
            │
            ├── [Add Authorized User] ──▶ AUTH_USER_ADDED
            │                               └── AuthUserResultCard (name + relationship)
            │                               └── BalanceTransferPanel (BT cards only)
            │                                       └── [Initiate] ──▶ BALANCE_TRANSFER_INITIATED
            │
            └── [Skip] ──▶ AUTH_USER_SKIPPED
                            └── BalanceTransferPanel (BT cards only)
                                    └── [Initiate] ──▶ BALANCE_TRANSFER_INITIATED
```

---

## Theme

Custom Tailwind colours (defined in `tailwind.config.js`):

| Token | Hex | Usage |
|-------|-----|-------|
| `creditcard-purple` | `#5B21B6` | Primary brand colour |
| `creditcard-gold` | `#D97706` | Accent / highlights |
| `citizens-green` | `#00965E` | Success states, approved |
| `citizens-navy` | `#003087` | Dark accents |

Card designs:

| Card Type | Design |
|-----------|--------|
| `CASH_BACK` | Summit Reserve — matte black with gold chip accent |
| `BALANCE_TRANSFER` | Summit — forest green with mountain silhouette |
| `NEW_TO_CREDIT` | Amp — bright green with wave graphic |

---

## Test SSNs

Use these on the application form to trigger specific pipeline outcomes:

| SSN | Expected Result |
|-----|----------------|
| `123-45-6789` | Approved → CARD_ISSUED (credit score 750) |
| `444-44-4444` | Approved → CARD_ISSUED (credit score 800) |
| `333-33-3333` | Approved → CARD_ISSUED (credit score 720, medium KYC risk) |
| `555-55-5555` | Borderline → may go MANUAL_REVIEW |
| `000-00-0000` | Identity verification fails → DENIED |
| `999-99-9999` | Watchlist match → DENIED |

For **Balance Transfer** post-issuance testing, use `333-33-3333` with card type **Balance Transfer**, set a transfer amount and source bank name.

---

## Build for Production

```bash
npm run build
```

Output is in `dist/`. Serve with any static file server or configure your reverse proxy to route `/api/*` to `http://localhost:8100/cc-application-service/1.0`.
