# MediScan AI

Smart Medicine Identification, Expiry Verification & Medication Reminder System using Computer Vision, Region-Based OCR, and Multimodal Vision AI.

![MediScan AI Banner](https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80)

## Overview

MediScan AI solves a critical pharmaceutical safety challenge: **reliably reading and verifying all packaging text printed on medicine strips**, especially small, faint, embossed, or separately stamped fields along crimped borders and margins.

### Key Capabilities

- **Region-Based Packaging Slicing**: Automatically isolates high-resolution crops from each strip:
  - **Top Crimp Zone**: Magnified sealed foil flap for stamped MFG/EXP dates and Batch numbers.
  - **Bottom Crimp Zone**: Lower packaging border for MRP and lot codes.
  - **Left & Right Vertical Margins**: Rotated 90° so vertical border dot-matrix stamps become horizontal.
  - **Center Body**: Active chemical salts, pharmacopeial standards (IP/USP/BP), and manufacturer details.
- **Multimodal Vision OCR with Model Cascade**: Uses `gemini-3.1-flash-lite` as the primary engine for high-speed, cost-effective multimodal vision extraction, with automated fallback cascades (`gemini-flash-latest`, `gemini-3.8-flash`).
- **Resilient Offline / Edge Extraction Fallback**: If cloud AI services experience high demand or network limits, an integrated optical packaging extraction engine prevents failures, normalizes fields, and presents results for verification.
- **Robust Deterministic Normalization**:
  - **MFG Date**: Detects variations (`MFG`, `MFD`, `MANF`, `MANUFACTURED`, `MFG. DATE`, `Mfg. Dt`, `Mfd on`, `Pkd`, `Date of Mfg`, `M.D.`, or stacked date pairs).
  - **EXP Date**: Detects variations (`EXP`, `EXPD`, `EXPIRY`, `EXPIRY DATE`, `Exp. Dt`, `Use Before`, `Valid Upto`, `Best Before`, `E.D.`).
  - **Batch Number**: Detects variations (`B.NO`, `BATCH`, `BATCH NO`, `LOT NO`, `LOT`, `B#`, `Ch.-B.`).
  - **MRP**: Identifies currency formats (`M.R.P.`, `MRP`, `Max. Retail Price`, `Rs.`, `₹`, `INR`).
  - **Manufacturer Name & Strength / Dosage**.
- **Individual Field Confidence Badges**: Displays dedicated `HIGH`, `MEDIUM`, or `LOW` confidence metrics for each field.
- **In-Place Field Editing & Timeline Validation**: Edit, verify, or correct any field in-place with immediate recalculation of expiry status.
- **Safety Expiry Alerts & Medication Schedules**: Daily/Weekly dose reminders with meal timing and status categorization (`VALID`, `EXPIRING_SOON`, `EXPIRED`).

---

## Architecture

```
Frontend (React 19 + TypeScript + Vite + Tailwind CSS)
   │
   ├── Region-Based Image Slicing (imagePreprocessing.ts)
   │     ├── Top Crimp Zone Crop (Unsharp mask)
   │     ├── Bottom Crimp Zone Crop
   │     ├── Rotated Margins (90° horizontal conversion)
   │     └── Center Formulation Body
   │
   ▼
Backend Server (Express + TypeScript / tsx)
   │
   ├── Multimodal Vision AI Cascade (@google/genai)
   │     ├── Primary: gemini-3.1-flash-lite
   │     └── Fallback: gemini-flash-latest / gemini-3.8-flash
   │
   ├── Resilient Optical Extraction & Deterministic Normalization
   │     ├── Stamped date-pair disambiguation
   │     ├── Currency & Batch lot extraction
   │     └── Expiry status computation
   │
   ├── Clinical Catalog Validation (medicineCatalog.ts)
   │
   ▼
Persistence (Local JSON Database / database/medicine_db.json)
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **bun** / **yarn** / **pnpm**
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/mediscan-ai.git
   cd mediscan-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

---

## Project Structure

```
├── database/                   # Persistent scan and reminder storage
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx       # Overview metrics, expired counts & schedules
│   │   ├── Header.tsx          # Navigation and clinical status indicators
│   │   ├── MedicineDetailModal.tsx # Full clinical view & reminder quick-actions
│   │   ├── Reminders.tsx       # Medication schedule and adherence manager
│   │   ├── SafetyGuide.tsx     # Safe medication disposal & reading guide
│   │   ├── ScanHistory.tsx     # Searchable repository of past scans
│   │   └── ScanMedicine.tsx    # Multi-frame burst, camera, presets & region OCR
│   ├── data/
│   │   └── medicineCatalog.ts  # Pharmacopeial catalog & therapeutic indications
│   ├── utils/
│   │   └── imagePreprocessing.ts # High-contrast region slicing & sharpness scoring
│   ├── App.tsx                 # Root application controller
│   ├── index.css               # Global Tailwind CSS styling
│   ├── main.tsx                # Client entry point
│   └── types.ts                # TypeScript interfaces and data contracts
├── server.ts                   # Express server & Gemini vision OCR cascade
├── vite.config.ts              # Vite configuration
├── package.json                # Project dependencies & scripts
└── tsconfig.json               # TypeScript compiler configuration
```

---

## License

MIT License. Designed for healthcare, clinical reference, and educational purposes.
