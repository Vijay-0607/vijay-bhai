# MandiMatch — Pre-Harvest Agricultural Marketplace Prototype

> **Tagline:** “Know your buyer and price before harvest.”  
> **Hackathon Prototype:** Built with React 18, Vite, TypeScript, Tailwind CSS, Zustand, and Recharts.

---

## 1. Product Overview

**MandiMatch** is a digital agricultural forward marketplace designed to protect Indian farmers and Farmer Producer Organizations (FPOs) from distress sales and harvest-day price crashes. 

Before harvesting, farmers publish upcoming crop yield availability, and institutional buyers (retailers, food processors, hospitality chains) declare procurement requirements. MandiMatch's smart matching engine pairs them using **crop type, quantity compatibility, price tolerance, harvest/delivery dates, and district proximity**. Users negotiate offers with counteroffers, compare bids against simulated APMC mandi benchmarks, and confirm pre-harvest agreements under an estimated 2.5% platform commission model.

> ⚠️ **Important Prototype Disclaimer:**  
> All market benchmark prices, transaction amounts, user verification badges, and buyer/farmer profiles are **simulated for hackathon evaluation and demonstration**. This prototype does not connect to live government market APIs (e.g. Agmarknet), bank payment gateways, or legal contracting systems.

---

## 2. Key Features

- **Multi-Role Experience**: Tailored dashboards and workflows for **Farmers**, **Commercial Buyers**, and **FPOs**.
- **Smart Matching Engine**: Algorithmic scoring formula:
  $$\text{Score} = \text{round}(40 \times \text{qtyFit} + 25 \times \text{priceFit} + 20 \times \text{dateFit} + 15 \times \text{distFit})$$
  Filters matches with $\text{Score} \ge 35$ and sorts by compatibility.
- **Fair Price Classifier**: Automatically flags trade suggestions as **Fair Price** ($\pm 5\%$ of mandi average), **Below Mandi**, or **Above Mandi**.
- **Interactive Deal Negotiation**: End-to-end status workflow: `Pending` ➔ `Negotiating` ➔ `Confirmed` ➔ `Completed` (or `Rejected`), enforcing strict recipient-only turn management.
- **FPO Bulk Lot Pooler**: Aggregates produce contributions across multiple member farmers into bulk lots to negotiate wholesale contracts.
- **Voice Input Assistant**: Browser speech recognition helper for quick crop and quantity entry.
- **12-Month Seasonal Price Curves**: Recharts interactive price trends, peak seasonal pricing months, and sentiment indicators for Tomato, Maize, Onion, and Green chilli.
- **Simulated Price Alerts**: Configure price watches for regional benchmark thresholds.
- **Interactive Commission Calculator**: Computes estimated monthly and annual revenue based on the 2.5% pre-harvest matching fee.
- **Trilingual Localization**: Complete interface available in **English (EN)**, **Hindi (हिं)**, and **Kannada (ಕನ್)** with exact regional crop translations:
  - Tomato: *टमाटर* / *ಟೊಮೆಟೊ*
  - Maize: *मक्का* / *ಮೆಕ್ಕೆಜೋಳ*
  - Onion: *प्याज* / *ಈರುಳ್ಳಿ*
  - Green chilli: *हरी मिर्च* / *ಹಸಿ ಮೆಣಸಿನಕಾಯಿ*
- **Theme & Responsiveness**: Light and dark modes with brand palette (`#1E5E3A` Leaf green, `#E8A317` Turmeric yellow), sidebar desktop layout, and bottom navigation bar on mobile screens down to 360px.
- **Local Persistence**: State and session persist safely in browser `localStorage`.

---

## 3. Technology Stack

- **Framework**: React 19 / 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with custom brand tokens
- **Routing**: React Router DOM (protected layout and public routes)
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React
- **Unit Testing**: Vitest + Testing Library + jsdom

---

## 4. Installation & Startup Commands

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Run production build and type check
npm run build

# 4. Run test suites
npm test
```

---

## 5. Demo Accounts & Judge Quick-Switch

You can test any role instantly using the **One-Click Demo Login** buttons on the login page or the **Judge Quick Switch** in the dashboard sidebar:

| Role | Demo Name | District | Specialty Produce / Scope |
|---|---|---|---|
| **Farmer** | Lakshmi Devi | Dharwad | 25q Hybrid Tomato, Drip-irrigated table crop |
| **Buyer** | Hotel Naveen Procurement | Hubballi | Commercial food chain sourcing tomatoes & vegetables |
| **FPO** | Basavaraj Raitha Utpadaka FPO | Hubballi | 48-member cooperative pooling tomato & chilli lots |

---

## 6. How the Matching Engine Works

When a farmer lists a crop lot and a buyer publishes a demand for the same commodity:

1. **Quantity Fit ($40\%$)**: 
   $$\text{qtyFit} = \frac{\min(\text{listingQty}, \text{demandQty})}{\max(\text{listingQty}, \text{demandQty})}$$
2. **Price Tolerance ($25\%$)**:
   $$\text{priceFit} = 1.0 \quad \text{if buyer max budget} \ge \text{farmer ask}$$
   $$\text{priceFit} = \max\left(0, 1 - \frac{\text{ask} - \text{budget}}{\text{ask}}\right) \quad \text{if buyer max budget} < \text{farmer ask}$$
3. **Date Compatibility ($20\%$)**:
   Calculates delivery window after harvest (0 to 5 days is 1.0 fit, penalizes dates before harvest).
4. **District Distance Fit ($15\%$)**:
   Same district = 1.0; Twin cities (Hubballi-Dharwad) = 0.95; Adjacent districts = 0.80; Regional = 0.55.
5. **Output**:
   - Suggested Trade Price = $\text{round}\left(\frac{\text{askingPrice} + \text{buyerMaxPrice}}{2}\right)$
   - Trade Quantity = $\min(\text{listingQuantity}, \text{demandQuantity})$
   - Deal Value = $\text{suggestedPrice} \times \text{tradeQuantity}$
   - Estimated Commission = $\text{dealValue} \times 2.5\%$

---

## 7. Sample Commission Calculation

Suppose Lakshmi lists 25 quintals of Tomato at ₹2,300/q and Hotel Naveen requires 30 quintals at maximum ₹2,100/q:
- **Trade Quantity**: $\min(25, 30) = 25\text{ quintals}$
- **Suggested Price**: $\frac{2300 + 2100}{2} = ₹2,200/\text{quintal}$
- **Simulated Deal Value**: $25 \times 2200 = ₹55,000$
- **Estimated Platform Commission ($2.5\%$)**: $55,000 \times 0.025 = ₹1,375$

---

## 8. Limitations of localStorage Demo Authentication

1. **Client-Side Only**: User profiles, offers, and session identifiers are stored in browser `localStorage`.
2. **No Secure Cryptographic Storage**: While plaintext passwords are not stored directly, client-side mock authentication cannot provide server-grade security or credential encryption.
3. **Local Scope**: Actions taken in one browser session are not synchronized in real-time across separate physical devices.

### OTP signup and SMS setup

Account creation verifies the submitted email or mobile number before creating the profile. Real SMS delivery requires a running PostgreSQL database and Twilio Verify settings in the uncommitted `server/.env`: `TWILIO_ACCOUNT_SID`, `TWILIO_VERIFY_SERVICE_SID`, and either the preferred `TWILIO_API_KEY_SID` plus `TWILIO_API_KEY_SECRET`, or `TWILIO_AUTH_TOKEN`. Twilio Verify handles the sender number and OTP validation. Copy the variable names from `server/.env.example`, fill them locally, and restart the backend. The app will report that SMS was not sent when Twilio is unavailable; it will not show a fake demo code for a phone number. Email-only local demo signup may use a clearly labeled on-screen test code when the backend or mail provider is unavailable.

### Supabase PostgreSQL setup

The backend uses Supabase's transaction-mode pooler (`DATABASE_URL`, port 6543) for application queries and the session-mode pooler (`DIRECT_URL`, port 5432) for Prisma migrations. Copy the Supabase connection string templates from `server/.env.example` into the uncommitted `server/.env`, replace `[YOUR-PASSWORD]` with your database password, and URL-encode any special characters in the password. Keep these credentials out of source control.

After configuring both URLs, apply the database migrations and seed the catalogue from the `server` directory:

```bash
npm run db:migrate:prod
npm run db:seed
```

The existing catalogue migration upgrades a database that already has the marketplace schema; it does not create all marketplace tables in a blank database.

---

## 9. Crop Catalogue

`src/data/crop-catalog.json` is the initial catalogue source. It contains 93 distinct crop products across 10 categories, with stable slugs, aliases, product forms, supported units, and optional Hindi/Kannada names. Translations are marked for native-speaker review; the UI falls back to the English name when a translation is missing.

The React app still stores listings, demands, offers, and alerts in browser `localStorage` for the hackathon demo. Its selectors use the bundled catalogue directly, so crop selection works without PostgreSQL. The backend exposes the same catalogue through its API for database-backed clients. To enable that API, configure and start PostgreSQL, apply the migration to a database with the existing marketplace schema, then seed the catalogue:

```bash
cd server
npm run db:migrate:prod
npm run db:seed
```

The backend exposes `GET /api/v1/crops`, optional `category`, `search`, `page`, and `pageSize` filters, `GET /api/v1/crops/categories`, and `GET /api/v1/crops/:identifier`. Without `page`, the crops endpoint returns the complete active catalogue. Listings, demands, and price alerts store crop slugs; the migration converts old enum values to their matching slugs and adds restrictive foreign keys without deleting trade rows. This migration is an upgrade for an existing database; it does not create the rest of the marketplace schema on a blank database.

The initial price data still covers only Tomato, Maize, Onion, and Green chilli, and is explicitly simulated. Other catalogue crops display “Price data unavailable” until real or separately labelled demo records exist. Adding a crop starts by adding a stable record to the shared JSON and rerunning the idempotent seed; no selector component needs a new crop list.

## 10. Features That Require Additional Services for Production

To transition from this hackathon prototype to a commercial production platform, the following backend components would be integrated:
1. **Relational Database**: PostgreSQL / MySQL with ACID compliance for ledger entries and audit logs.
2. **Authentication Service**: OAuth2, Firebase Auth, or OTP verification via SMS (Twilio / Fast2SMS).
3. **Escrow Payment Gateway**: Integration with UPI / Razorpay / Cashfree escrow accounts.
4. **Live Mandi Price Feeds**: Automated ETL pipeline ingesting daily Agmarknet government APMC data.
5. **Push & SMS Notifications**: AWS SNS or Firebase Cloud Messaging to send real-time SMS to farmers without smartphones.
6. **Physical Quality Verification**: Inspection and moisture testing certification workflow at village aggregation hubs.

---

## 11. Complete Hackathon Demonstration Script

Follow this step-by-step evaluation workflow:

1. **Landing Page**:
   - Open `/`. Verify the headline: *“Know your buyer and price before harvest.”*
   - Review live match preview cards and submit the priority pilot waitlist form.
2. **Farmer Experience**:
   - Click **“🌾 Farmer”** demo button. You are logged in as **Lakshmi Devi**.
   - Check the KPI metrics, deal charts, and platform commission calculator.
   - Go to **“Sell Harvest”** (`/app/sell`). Test voice input or enter a new Tomato listing in Hubballi (35q @ ₹2,000/q). Click **Publish Harvest Listing**.
3. **Buyer Experience**:
   - In the sidebar, click the **Judge Quick Switch “Buyer”** button. You are logged in as **Hotel Naveen Procurement**.
   - Navigate to **“Smart Matches”** (`/app/matches`). View the matching Tomato lot. Click **Send Offer** with quantity 30q @ ₹2,000/q.
4. **Negotiation & Deal Confirmation**:
   - Switch back to **“Farmer”**. The dashboard shows the pending offer.
   - Click **Accept** (or test **Counter** to adjust the price). The deal status immediately transitions to **Confirmed Deal**.
5. **Market Trends & Price Alert**:
   - Go to **“Crop Prices”** (`/app/prices`). View the 12-month seasonal curve for Tomato, Maize, Onion, and Green chilli.
   - Set a simulated price alert for ₹2,200/q.
6. **Multilingual Test**:
   - Click **ಕನ್** (Kannada) or **हिं** (Hindi) in the top navigation bar. Verify that navigation labels, buttons, and crops (*ಟೊಮೆಟೊ*, *ಮೆಕ್ಕೆಜೋಳ*, *ಈರುಳ್ಳಿ*) translate seamlessly.
7. **Mobile Responsiveness**:
   - View in mobile layout (360px). Notice the bottom navigation bar with $\ge 44\text{px}$ touch targets.
8. **Logout & Route Guard**:
   - Click **Logout**. Protected route `/app/dashboard` redirects back to `/login`.
