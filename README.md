# MediScan AI

Smart Medicine Identification, Expiry Verification & Packaging OCR System using Computer Vision, Region-Based Packaging Slicing, and Generative Multimodal AI.

![MediScan AI Banner](https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80)

## 1. What the Project Does

MediScan AI solves a critical pharmaceutical safety challenge: **reliably reading and verifying all packaging text printed on medicine strips**, especially small, faint, embossed, or separately stamped fields along crimped borders and margins.

It provides clinical pharmacists, healthcare professionals, and patients with instant automated packaging text recognition, expiration auditing, active formulation matching, and historical scan repository tracking.

---

## 2. Main Features

- **Direct Scanner-First Experience**: Opens directly to the high-resolution scanning console (`/`) with multi-frame burst camera capture, drag-and-drop file upload, and sample presets.
- **Region-Based Packaging Slicing**: Automatically isolates high-resolution crops from each strip:
  - **Top Crimp Zone**: Magnified sealed foil flap for stamped MFG/EXP dates and Batch numbers.
  - **Bottom Crimp Zone**: Lower packaging border for MRP and lot codes.
  - **Left & Right Vertical Margins**: Rotated 90° so vertical border dot-matrix stamps become horizontal.
  - **Center Formulation Body**: Active chemical salts, pharmacopeial standards (IP/USP/BP), and manufacturer details.
- **Multimodal Vision OCR with Model Cascade**: Uses `gemini-3.1-flash-lite` as the primary engine for high-speed, cost-effective multimodal vision extraction, with automated fallback cascades (`gemini-flash-latest`, `gemini-3.8-flash`).
- **Resilient Offline / Edge Extraction Fallback**: If cloud AI services experience high demand or network limits, an integrated optical packaging extraction engine prevents failures, normalizes fields, and presents results for verification.
- **Deterministic Clinical Normalization**:
  - **MFG Date**: Normalizes variations (`MFG`, `MFD`, `MANF`, `MANUFACTURED`, `MFG. DATE`, `Mfg. Dt`, `Mfd on`, `Pkd`, `Date of Mfg`, `M.D.`, or stacked date pairs).
  - **EXP Date**: Normalizes variations (`EXP`, `EXPD`, `EXPIRY`, `EXPIRY DATE`, `Exp. Dt`, `Use Before`, `Valid Upto`, `Best Before`, `E.D.`).
  - **Batch Number**: Identifies (`B.NO`, `BATCH`, `BATCH NO`, `LOT NO`, `LOT`, `B#`, `Ch.-B.`).
  - **MRP**: Formats currency (`M.R.P.`, `MRP`, `Max. Retail Price`, `Rs.`, `₹`, `INR`).
  - **Manufacturer Name, Dosage & Active Formulation**.
- **Individual Field Confidence Badges**: Displays dedicated `HIGH`, `MEDIUM`, or `LOW` confidence metrics for each field.
- **In-Place Field Editing & Timeline Recalculation**: Edit, verify, or correct any field in-place with immediate recalculation of expiry status.
- **Overview & Historical Records Archive**: Secondary monitoring console (`/overview`) and full search/filter historical repository (`/scan-history`) with CSV export.
- **Bilingual Interface**: Clean language toggle (`EN` / `HI`) with zero layout shift.
- **Robust 404 Handling**: Custom 404 page with return-to-scanner workflow.

---

## 3. Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons.
- **Backend**: Express, Node.js (ESNext / TypeScript via tsx & esbuild).
- **Vision AI**: Google Gen AI SDK (`@google/genai`) multimodal vision cascade.
- **Testing**: Node.js built-in test runner (`node --test`).
- **Persistence**: Atomic local JSON database repository (`database/medicine_db.json`).

---

## 4. Project Structure

```
├── database/                   # Persistent scan repository
│   ├── .gitkeep                # Git tracking placeholder
│   └── medicine_db.json        # Scan records storage (git-ignored)
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── Skeleton.tsx    # Reusable loading skeletons
│   │   ├── Dashboard.tsx       # Overview metrics & monitoring (/overview)
│   │   ├── Header.tsx          # Clean header with brand & language toggle
│   │   ├── SecondaryNav.tsx    # Secondary navigation (Overview & Scan History)
│   │   ├── NotFound.tsx        # 404 page with return to scanner (/404)
│   │   ├── MedicineDetailModal.tsx # Full clinical dossier modal
│   │   ├── ScanHistory.tsx     # Searchable repository of past scans (/scan-history)
│   │   └── ScanMedicine.tsx    # Primary workflow: burst capture, camera, presets & OCR (/)
│   ├── context/
│   │   └── LanguageContext.tsx # Multilingual translations & language toggle
│   ├── data/
│   │   └── medicineCatalog.ts  # Pharmacopeial catalog & therapeutic indications
│   ├── utils/
│   │   └── imagePreprocessing.ts # High-contrast region slicing & sharpness scoring
│   ├── App.tsx                 # Root application controller & router
│   ├── index.css               # Global Tailwind CSS styling
│   ├── main.tsx                # Client entry point
│   └── types.ts                # TypeScript interfaces and data contracts
├── test/
│   ├── expiry.test.mjs         # Unit tests for expiry status calculation
│   └── catalog_db.test.mjs     # Integration tests for database and catalog
├── server.ts                   # Express server & Gemini vision OCR cascade
├── vite.config.ts              # Vite configuration with chunk splitting
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # TypeScript compiler configuration
└── .env.example                # Environment variable documentation
```

---

## 5. Installation

1. Clone repository:
   ```bash
   git clone https://github.com/your-username/mediscan-ai.git
   cd mediscan-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## 6. Environment Variables

Create `.env` based on `.env.example`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for multimodal vision OCR | *(Required for cloud OCR)* |
| `PORT` | HTTP port for server (in standalone production) | `3000` (or `8080` in cloud containers) |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |

---

## 7. Local Development

Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. Build Commands

Compile client assets and server bundle for production:
```bash
npm run build
```

This generates:
- `dist/index.html` — Production HTML entry point
- `dist/assets/vendor-*.js` — React & core vendor bundle
- `dist/assets/icons-*.js` — Split Lucide icon bundle
- `dist/assets/index-*.js` — Application bundle
- `dist/server.cjs` — Bundled production Express server

To run the production build:
```bash
npm start
```

---

## 9. Testing

Run unit and integration test suites:
```bash
npm test
```

Run TypeScript type check:
```bash
npm run lint
```

---

## 10. Deployment

### Google Cloud Run / Container Platforms
1. Build the production application:
   ```bash
   npm run build
   ```
2. Start using the bundled server:
   ```bash
   npm start
   ```
   The server automatically detects the container port and serves both static client assets and API endpoints.

### Dockerfile (Reference)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 11. Important Architectural Decisions

1. **Scanner as Homepage (`/`)**: Unlike traditional dashboard-first apps, MediScan puts the primary camera/upload workflow immediately on load.
2. **Three-Tier Navigation Layout**: Clean header with brand and language toggle, secondary sub-navigation with Overview and Scan History, and full-width main view.
3. **Atomic File Storage**: `database/medicine_db.json` uses atomic writes via `.tmp` file renaming to avoid corruption during concurrent reads/writes.
4. **Resilient Vision Cascade**: If primary model calls encounter network congestion, the server seamlessly cascades down to fallback models and local optical heuristics.
5. **Code Splitting**: Rollup `manualChunks` splits vendor React, Lucide icons, and application code into small cacheable bundles.

---

## 12. Known Limitations

- Optical character recognition of faint dot-matrix embossed foil crimps requires adequate ambient lighting; users can toggle the high-contrast foil filter or zoom crops for optimal legibility.
- Clinical formulations and indication details are provided as educational references; medical decisions must always be confirmed with a licensed healthcare practitioner.

---

## License

MIT License.
