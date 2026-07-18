# Fólio Vivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar a marca Vértice, substituir os dashboards genéricos pelos portais Fólio Vivo/Mesa de Operações e entregar uma `dist` navegável no Netlify.

**Architecture:** Preservar dados, repositório e rotas atuais; reorganizar apresentação em componentes editoriais compartilhados e experiências específicas por perfil. Cada comportamento novo começa com teste de regressão, seguido de implementação mínima e verificação do escopo completo.

**Tech Stack:** React 18, React Router 6, TypeScript, Tailwind CSS, Framer Motion, Vitest e Testing Library.

**Repository note:** `.git` existe, mas está vazio e não é um repositório válido; worktrees e commits não estão disponíveis. Usar checkpoints de teste em vez de commits.

---

### Task 1: Build, SPA routing and route lifecycle

**Files:**

- Create: `public/_redirects`
- Modify: `src/app/RootApp.tsx`
- Modify: `src/features/client/ClientProfilePage.tsx`
- Modify: `src/features/client/NewRequestPage.tsx`
- Modify: `src/app/RootApp.test.tsx`
- Modify: `src/features/client/ClientPortal.test.tsx`

- [ ] Write regression tests for scroll-to-top/hash navigation and for unambiguous client dashboard assertions; run them and confirm RED.
- [ ] Capture `currentUser.id` after the null guards so TypeScript preserves narrowing inside handlers.
- [ ] Add a route lifecycle component that scrolls new paths to the top and resolves hash targets after render without smooth motion.
- [ ] Add `/* /index.html 200` to `public/_redirects`.
- [ ] Replace the ambiguous protocol assertion with a role/region-based assertion.
- [ ] Run routing/client tests, then `npm run build`; expect exit 0 and `dist/_redirects` present.

### Task 2: Shared Fólio visual foundation and accessible shell

**Files:**

- Modify: `tailwind.config.ts`
- Modify: `src/styles.css`
- Modify: `src/components/portal/PortalShell.tsx`
- Modify: `src/components/portal/PortalPrimitives.tsx`
- Modify: `src/components/portal/PortalShell.test.tsx`
- Create: `src/components/portal/CaseFolio.tsx`
- Create: `src/components/portal/CaseFolio.test.tsx`

- [ ] Write tests for Vértice brand rendering, semantic five-phase progress, mobile navigation, active index state and keyboard-safe overlays; confirm RED.
- [ ] Add accessible palette tokens (`action #0F766E`, stronger muted text/borders) and shared editorial surface/rule styles.
- [ ] Replace the SaaS pill sidebar with a numbered index rail; keep notifications, logout, drawer focus trap and 44 px targets.
- [ ] Align header/main widths; keep the drawer through tablet widths so 1024 px content is not squeezed.
- [ ] Build `CaseFolio` with protocol, property, objective, macrophase, attention overlay and slots for actions/documents/history.
- [ ] Replace internal `<a>` navigation with `Link`/`NavLink`.
- [ ] Run component tests and verify keyboard/focus behavior.

### Task 3: Client Dossiê Vivo

**Files:**

- Modify: `src/features/client/ClientDashboard.tsx`
- Modify: `src/features/client/ClientProcessesPage.tsx`
- Modify: `src/features/client/ClientProcessDetailPage.tsx`
- Modify: `src/features/client/ClientPortal.tsx`
- Modify: `src/features/client/ClientPortal.test.tsx`

- [ ] Add failing tests for property-first cover, one dominant “Agora” action, no-action state, folio index, semantic macrophases and document focus handoff.
- [ ] Replace KPI/card dashboard with process index + active folio + sticky “Agora” panel; default to the newest process with a client action.
- [ ] Convert the process list into a folio index with address/service/protocol/phase and explicit empty state.
- [ ] Recompose detail as cover, phase ruler, documents ledger and movement diary; remove generic signature placeholder card.
- [ ] Connect pending actions to document anchors, focus their heading and announce updates in `aria-live`.
- [ ] Implement mobile accordions and reserve space for the contextual bottom CTA.
- [ ] Run all client tests and verify empty, rejected, completed and missing-process states.

### Task 4: Admin Mesa de Operações

**Files:**

- Modify: `src/features/admin/AdminPortal.tsx`
- Modify: `src/features/admin/AdminProcessPages.tsx`
- Modify: `src/features/admin/AdminDocumentsPage.tsx`
- Modify: `src/features/admin/AdminClientsPage.tsx`
- Modify: `src/features/admin/AdminPortal.test.tsx`

- [ ] Add failing tests for Pauta groups, Pulso strip, contextual dispatch, “Despachar e seguir”, responsive filters and accessible completion/rejection dialogs.
- [ ] Replace the 4+4 card dashboard with Pauta, active dossier and contextual dispatch; order only by action kind and `updatedAt`.
- [ ] Present process search as a dense ledger on desktop and cards on mobile; move the four-column filter breakpoint to a width that fits.
- [ ] Convert documents to an editorial desktop table/mobile list with valid contextual actions and next-item continuation.
- [ ] Recompose process detail around the shared folio plus operational strip; implement dialog focus, Escape, trap and restoration.
- [ ] Convert clients into an index of parties and linked processes without oversized equal-height cards.
- [ ] Run all admin tests, including document decisions and completed read-only flow.

### Task 5: Vértice brand, login and interactive service catalog

**Files:**

- Asset: `public/brand/vertice-consultoria.png`
- Modify: `src/App.tsx`
- Modify: `src/features/auth/LoginPage.tsx`
- Modify: `src/components/ui/zoom-parallax.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/LandingPortal.test.tsx`
- Modify: `src/features/auth/LoginPage.test.tsx`

- [ ] Add failing tests for brand placement, nine-service category explorer, selected-service detail and hidden hero inertness.
- [ ] Replace text-only product marks with the transparent Vértice asset on landing, login and footer, using light/dark layout backgrounds.
- [ ] Replace the sparse category grid with category index + selected service panel; use accordions on mobile.
- [ ] Preserve pending-service handoff to login/new request and use router links for internal navigation.
- [ ] Make the unrevealed hero `inert` and `aria-hidden`; remove it from the tab sequence until visible.
- [ ] Remove unused guided-flow code that is no longer rendered, while preserving approved landing sections.
- [ ] Run landing and login tests.

### Task 6: Full verification, visual QA and handoff

**Files:**

- Update: `docs/state.md`
- Generate: `dist/**`

- [ ] Run `npm test` and require 0 failed tests.
- [ ] Run `npm run build` and require exit 0.
- [ ] Confirm `dist/_redirects`, brand asset and current bundles exist.
- [ ] Serve the built output as a static SPA and verify `/`, `/login`, `/cliente`, `/cliente/processos/case-0001`, `/admin`, `/admin/documentos` and refresh behavior.
- [ ] Inspect landing, login and every client/admin route at 375, 768, 1024 and 1440 px; verify no horizontal clipping or unexplained stretched blanks.
- [ ] Test keyboard navigation, focus restoration, reduced motion and text/control contrast.
- [ ] Update `docs/state.md` with completed work and any honest remaining operational placeholders.
