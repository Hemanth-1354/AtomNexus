# AtomQuest Hackathon 1.0 - In-House Goal Setting & Tracking Portal

## 🚀 Live Demo Walkthrough

The application is fully functional and handles the end-to-end flow: Goal Setting, Approval, and Quarterly Check-ins.

## 🏗️ Technical Architecture

### 1. Frontend: React + Vite + Vanilla CSS
*   **Performance:** Vite guarantees ultra-fast hot reloading and production builds.
*   **Design Aesthetic:** Developed a premium dark-mode UI with **Glassmorphism**, neon accents, glowing inputs, and smooth transitions built entirely using **Vanilla CSS**. This completely bypasses generic Tailwind frameworks for a custom, stand-out feel.
*   **Routing:** React Router handles secured role-based path switching (`/login`, `/goals`, `/check-ins`).

### 2. Backend: Node.js + Express
*   **Stateless Authentication:** Custom JWT integration that mocks Microsoft Entra ID (SSO) login.
*   **Validation:** Strict backend and frontend enforcement of the `<100% Weightage>`, `<10% Minimum>`, and `Max 8 Goals` rules.

### 3. Database: SQLite (Embedded)
*   **Why SQLite?:** Selected for rapid deployment and zero-configuration setups, making the system immediately "deploy ready".
*   **Structure:** Normalized tables for `users`, `goals`, and `check_ins` with cascading foreign keys to track approvals and quarterly metrics accurately.

## 🌟 Implemented Features

### Phase 1: Goal Creation & Approval (Must-Have)
- ✅ **Employee Portal:** Employees select Thrust Areas, Input UoM types, set Targets, and manage Weightages.
- ✅ **Strict Validation Rules:** System throws errors if weightages don't match the 100% limit.
- ✅ **Manager Approval Workflow:** Managers can view team goals, inline edit targets/weightages, and approve/reject.

### Phase 2: Achievement Tracking & Quarterly Check-ins (Must-Have)
- ✅ **Quarterly Selectors:** Filter check-ins by Q1, Q2, Q3, and Q4.
- ✅ **Progress Logic:** System calculates achievement vs target ratios based on the specific metric type (e.g. `Min Numeric`, `Max Numeric`, or `Zero` tolerance).
- ✅ **Manager Feedback:** Dedicated spaces for both employee self-assessment and manager feedback.

### Bonus / Good-to-Have Features
- 🎁 **Microsoft Entra ID (SSO) Integration Theme:** Designed the authentication interface to mirror enterprise SSO systems with role-based routing (Admin, Manager, Employee).
- 🎁 **Analytics Dashboards:** Embedded dynamic Bar Charts (using Recharts) to analyze goal distribution states (Draft vs Pending vs Approved).

## How to Run
1. `cd backend`
2. `npm install`
3. `node index.js`

In a separate terminal:
1. `cd frontend`
2. `npm install`
3. `npm run dev`

Test Credentials:
- emp1@atomquest.com / password123
- manager1@atomquest.com / password123
- admin@atomquest.com / password123
