# pdf-billing-form-builder – Copilot Instructions
## Project Snapshot
- Vite + React 18 + TypeScript + Tailwind + shadcn/Radix; entry flows `src/main.tsx → App.tsx`.
- Single-page experience in `src/pages/Index.tsx` builds a printable reimbursement form plus receipt bundle.
- Router uses `<BrowserRouter basename={import.meta.env.BASE_URL}>`; keep links root-relative for GitHub Pages hosting.

## Dev Workflow
- Install deps with `npm install`.
- `npm run dev` serves on `::1:8080`; `vite.config.ts` switches `base` to `/pdf-billing-form-builder/` for production.
- `npm run build`, `npm run build:dev`, `npm run preview`, `npm run lint` cover CI parity.
- `npm run deploy` (requires `gh-pages` CLI) mirrors `.github/workflows/deploy.yml`, which builds on every push to `main`.

## App Structure
- `App.tsx` wires `QueryClientProvider`, `TooltipProvider`, shadcn `Toaster`, Sonner `Toaster`, and the router—keep these providers intact when adding pages.
- `src/pages/Index.tsx` owns `formData`, `receipts: File[]`, `language`, `isGenerating`; use the `updateField(field)` helper to mutate `FormData` keys consistently.
- Form inputs live in `components/FormField.tsx`, which toggles between `Input`/`Textarea` based on `multiline`; always pass simple string values.
- Receipt handling happens in `components/ReceiptUpload.tsx`; it validates MIME types, resets the hidden `<input>` via `fileInputRef`, and surfaces errors through `sonner`.

## PDF Generation
- `src/utils/pdfGenerator.ts` is the single source of truth for the `FormData` contract and draws every box/header manually with jsPDF coordinates.
- `loadImageAsDataURL` + `fitImageToPage` expect image MIME types; PDFs currently won’t render unless you rasterize them first.
- `SignatureCanvasComponent` feeds a PNG data URL into the recipient box (70×20 mm); keep signatures compact to avoid oversized base64 strings.
- File names derive from `formData.date`; sanitize any new fields before concatenating to avoid invalid filenames.

## i18n & UX
- All copy/toast strings live in `src/i18n/translations.ts`; add text for `ru`, `en`, `uk`, `pl` and extend the `Language` union + `languageNames` when introducing new locales.
- `components/LanguageSwitcher.tsx` is the only control that mutates language state—propagate new translations through it.
- Validation and toast messages in `Index.tsx` must come from the translation tables to keep Sonner output localized.
- Reuse the `updateField` closures whenever you add `FormData` keys so every field stays controlled.

## Styling & UI System
- Tailwind tokens are declared as HSL CSS variables in `src/index.css` (light + dark). Update both palettes when adding colors.
- `tailwind.config.ts` already scans `./src/**/*`; follow existing spacing/typography so the rendered PDF matches on-screen layout.
- shadcn primitives under `src/components/ui/*` plus the `cn` helper (`src/lib/utils.ts`) are the preferred building blocks.

## Notifications & Integrations
- Both shadcn `useToast` (`components/ui/toaster.tsx`) and `sonner` (`toast` import) are available; pick Sonner for simple alerts, shadcn for custom actions.
- TanStack Query is initialized even though no queries exist—future data fetching can hook straight into the provided `QueryClient`.
- `vite.config.ts` conditionally adds `lovable-tagger` in development; keep plugin order intact to avoid SWC conflicts.

## Pitfalls & Tips
- `ReceiptUpload` accepts `image/*` and `application/pdf`, but `pdfGenerator` only renders images—either restrict uploads or add PDF-to-image conversion before calling `generatePDF`.
- Always reset the hidden file input when mutating `receipts` (see existing `fileInputRef` pattern) to prevent stale selections.
- Deployment relies on `import.meta.env.BASE_URL`; avoid hard-coded absolute asset URLs.
- Test the PDF with long Polish/Ukrainian strings because `doc.splitTextToSize` truncates after three lines; adjust `contentWidth` before adding fields with verbose text.