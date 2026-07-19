# SOFTWARE DEVELOPMENT INVOICE & DELIVERABLES BREAKDOWN

**Invoice Number:** STX-2026-07-001  
**Date:** July 18, 2026  
**Due Date:** Upon Receipt  
**Billing Cycle:** Project Completion (Final Milestone)  
**Currency:** Indian Rupee (INR - ₹)  

---

## 1. PARTIES

### Developer / Service Provider
*   **Name/Agency:** DevFlick Solutions
*   **Email:** developer@devflicks.io
*   **Tax Registration (GSTIN):** 27AAAAA1111A1Z1 *(Mock GSTIN for billing verification)*

### Client Details
*   **Client Name:** Stonex Minerals & Logistics Group
*   **Contact:** stonexmeopr@gmail.com
*   **Project Name:** Stonex Integrated Web Application & Admin Dashboard Modernization

---

## 2. PROJECT OVERVIEW

This invoice details the engineering and delivery of the **Stonex Integrated Platform**. The scope involved migrating a legacy, static, multi-page HTML/CSS website into a high-performance, single-page application (SPA) built with **React 19**, **TypeScript**, and **Tailwind CSS v4**, backed by a secure **Firebase Firestore** database and **Firebase Authentication**.

### Core Technical Pillars:
1.  **Frontend Modernization:** Replaced static templates with modular, typed React components using responsive layout design.
2.  **Durable Cloud Persistence:** Designed and integrated a secure Firestore database containing leads, products, announcements, and logistics.
3.  **Media Uploading & Performance Optimization:** Solved complex browser preload flickering issues on the main Hero video and image banner.
4.  **Role-Based Security:** Constructed custom user registers and overlays protecting administrative routes.

---

## 3. COMPREHENSIVE DELIVERABLES & FEATURE BREAKDOWN

| Task / Module | Description | Technical Implementation | Hours | Amount (INR) |
| :--- | :--- | :--- | :---: | :---: |
| **Phase 1: Architecture & DB Design** | Setup project boilerplate with Vite, TypeScript, and Firebase. Structured the database blueprints and security rules. | Created `firestore.rules`, `firebase-blueprint.json`, and implemented lazy initialization in `src/lib/firebase.ts`. | 15 | ₹37,500 |
| **Phase 2: Legacy Frontend Migration** | Ported raw assets, style rules, and structural logic from static files (`tmp_frontend/`) to high-fidelity, interactive React widgets. | Clean Tailwind layout, CSS-in-JS conversion, and modular layout integration in `src/App.tsx`. | 45 | ₹1,12,500 |
| **Phase 3: Auth & Role Registry** | Installed secure Google/Email authentication and a strict administrative role control layer. | Created `LoginOverlay.tsx` and `RoleRegistrySection.tsx` with customized security verification states. | 20 | ₹50,000 |
| **Phase 4: Operational Dashboards** | Built administrative tabs for Lead Management, Product Catalogs, Logistics pipelines, and Announcements. | Built `LeadsSection.tsx`, `ProductsSection.tsx`, `LogisticsSection.tsx`, and `AnnouncementsSection.tsx`. | 35 | ₹87,500 |
| **Phase 5: Hero Media Optimization** | Patched asset preloading, configured active browser fallback images, and streamlined media uploading mechanics. | Re-engineered `HeroSection.tsx`, resolved viewport rendering delays, and engineered upload status feedback. | 15 | ₹37,500 |
| **Phase 6: QA, Performance & Build** | Full unit-testing suite compliance, static type analyses (`tsc`), bundle bundling minimization, and layout polishing. | Configured `vite.config.ts`, streamlined bundle chunks, and cleared hydration warnings. | 10 | ₹25,000 |

---

## 4. LINE ITEM COST BREAKDOWN

| Item No. | Description | Rate per Hour (INR) | Total Hours | Total Price (INR) |
| :---: | :--- | :---: | :---: | :---: |
| 1 | Senior Full-Stack Engineering (React 19 + TypeScript + Firebase) | ₹2,500 | 115 | ₹2,87,500 |
| 2 | UI/UX Prototyping & Tailwind v4 Theme Construction | ₹2,500 | 15 | ₹37,500 |
| 3 | System Testing, Linter Compliance & Build Optimization | ₹2,500 | 10 | ₹25,000 |
| **-** | **Subtotal** | | **140 Hours** | **₹3,50,000** |
| **-** | **CGST @ 9%** | | | **₹31,500** |
| **-** | **SGST @ 9%** | | | **₹31,500** |
| **-** | **Total Due (Inclusive of Taxes)** | | | **₹4,13,000** |

**Total Amount Payable:** **₹4,13,000/- (Rupees Four Lakh Thirteen Thousand Only)**

---

## 5. REVENUE MILESTONES & PAYMENTS

*   **Milestone 1 (Advance / Retainer):** 30% *Paid* (₹1,05,000)
*   **Milestone 2 (Beta Delivery & DB Integration):** 40% *Paid* (₹1,40,000)
*   **Milestone 3 (Final Delivery, Media Preload Fix & Signoff):** 30% *Due Now* (₹1,05,000)
*   **GST Add-on (18% of Subtotal):** *Due Now* (₹63,000)

**Net Outstanding Balance:** **₹1,68,000/-**

---

## 6. BANK TRANSFER DETAILS (IMPS/NEFT/RTGS)

*   **Bank Name:** HDFC Bank Ltd.
*   **Account Name:** DevFlick Solutions Private Limited
*   **Account Type:** Current Account
*   **Account Number:** 50200012345678 *(Mock Account Number)*
*   **IFSC Code:** HDFC0000123 *(Mock IFSC)*
*   **Branch:** Mumbai Central, Maharashtra, India

---

## 7. TERMS & CONDITIONS

1.  **Payment Term:** 7 Days from the invoice date (Net 7).
2.  **Intellectual Property:** All intellectual property, code files, design assets, and database schemas will fully transfer to the client upon receipt of the final payment.
3.  **Support and Maintenance:** Includes 30 days of complimentary technical support starting from the date of final payout, covering bug fixes and minor style adjustments.
4.  **Hosting:** Cloud Run container environment and Firebase Hosting costs are to be paid directly by the client under their own account credentials.

---

*Thank you for partnering with us to build the Stonex Admin Platform! We look forward to working on more projects together.*
