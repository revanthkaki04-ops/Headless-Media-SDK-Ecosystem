# 🦉 Headless Media SDK Ecosystem — FootOwl Engineering Deliverable

> **Production-grade multi-package monorepo architecture for media search, presentation, and telemetry powered by the Pexels API.**
> Engineered with strict dependency isolation, zero-dependency core, and headless UI prop-getter design patterns.

---

## 📌 Executive Summary for FootOwl Engineering

This repository represents the complete deliverable for the **FootOwl Frontend Engineering Take-Home Assessment**. It solves the core challenge of delivering a scalable, cross-platform media architecture by strictly separating core API protocols, platform state wrappers, and unstyled headless UI hooks.

### 🌟 Key Architectural Achievements
- 🛡️ **Strict Boundary Isolation**: Zero circular dependencies between packages. `core` is 100% pure TypeScript; `headless-ui` contains zero CSS and zero `core` imports.
- 🎨 **Genuine Headless Prop-Getter Pattern**: Complete visual inversion of control using `useGrid`, `useLightbox`, and `useReelSwiper` with custom `mergeProps` utility.
- 🔑 **Enterprise API Key Security**: Multi-tier authentication supporting environment variables (`VITE_PEXELS_KEY`), dynamic runtime fallback modal, and safe `localStorage` key rotation without secret leakage.
- ⚡ **In-Memory TTL Cache & Telemetry**: 5-minute request caching de-duplication paired with a strongly-typed `SDKEventEmitter` logging `view` and `download` events.
- 🤖 **AI-Steered Execution & Skill Docs**: Built using a 20-stage AI steering methodology governed by domain-specific skill specifications (`media-data-skill` & `media-ui-skill`).

---

## 🏗️ Monorepo Topology & Architecture

```
.
├── pnpm-workspace.yaml          # Monorepo workspace configuration
├── package.json                 # Root script runner & workspace dependencies
├── tsconfig.json                # Shared root base TypeScript configuration
├── README.md                    # Architecture & submission documentation
├── .agents/
│   └── skills/                  # AI Agent Steering Skill Specifications
│       ├── media-data/SKILL.md  # Data layer & provider AI rules
│       └── media-ui/SKILL.md    # Headless UI prop-getter AI rules
├── packages/
│   ├── media-core/              # Pure TS SDK (Pexels API Client, Cache, Event Emitter)
│   ├── media-react/             # React State & Context Wrapper (Hooks, Provider)
│   ├── media-ui-react/          # Headless UI Prop-Getter Hooks (Grid, Lightbox, Swiper)
│   ├── media-native/            # [Scaffolded] React Native Core Integration Contract
│   └── media-ui-native/         # [Scaffolded] React Native Headless UI Contract
└── apps/
    └── web/                     # Web Consumer Application (App.tsx + Showcase)
        ├── .cursorrules-data    # AI Developer Guide: Data & Event Layer
        ├── .cursorrules-ui      # AI Developer Guide: Headless UI Layer
        └── public/
            ├── sdk-docs.html    # Interactive SDK Documentation Page
            └── ui-docs.html     # Interactive Headless UI Component Documentation Page
```

---

## 🛡️ Package Boundary Matrix & Dependency Rules

To guarantee zero architectural degradation over time, the system strictly enforces the following layer contract:

```mermaid
graph TD
    Web[apps/web] -->|Imports| MediaReact[@media-sdk/react]
    Web -->|Imports| MediaUIReact[@media-sdk/ui-react]
    MediaReact -->|Imports| MediaCore[@media-sdk/core]
    MediaUIReact -.->|Zero Core Dependency| PureState[Pure Headless Prop-Getters]
    MediaCore -.->|Zero DOM/React| PureTS[Pure TypeScript]
```

### Boundary Isolation Matrix

| Package | May Import | Must NOT Import | Responsibilities |
| :--- | :--- | :--- | :--- |
| **`media-core`** | Zero internal packages | DOM, React, UI packages | HTTP client, API interfaces, caching, event emitter |
| **`media-react`** | `media-core`, `react` | `media-ui-react`, DOM styling | Context provider, data fetching hooks, pagination |
| **`media-ui-react`** | `react` | `media-core`, CSS, Tailwind | Headless prop-getters (`useGrid`, `useLightbox`, `useReelSwiper`) |
| **`web-app`** | `media-react`, `media-ui-react` | Internal hidden sub-paths | Consumer UI, custom styling, layout integration |

> [!IMPORTANT]
> **FATAL ERROR PROTECTION**:
> 1. `@media-sdk/react` CANNOT import `@media-sdk/ui-react`.
> 2. `@media-sdk/ui-react` CANNOT import `@media-sdk/core` or any CSS framework.
> 3. `apps/web` is the **only** layer where data hooks (`media-react`) and headless UI hooks (`media-ui-react`) converge.

---

## 🎨 Headless "Prop-Getter" Design Pattern

Instead of shipping pre-styled components, `@media-sdk/ui-react` exposes **pure behavior & accessibility prop-getters**:

```tsx
// 1. Hook manages state, ARIA attributes, keyboard focus, and event handlers
const { getContainerProps, getItemProps } = useGrid({ fetchNextPage, hasNextPage });

// 2. Consumer app supplies 100% custom markup and CSS
return (
  <div {...getContainerProps({ className: 'custom-grid-layout' })}>
    {photos.map((photo, i) => (
      <div key={photo.id} {...getItemProps(i, { className: 'glass-card' })}>
        <img src={photo.src.medium} alt={photo.alt} />
      </div>
    ))}
  </div>
);
```

### Key Architectural Benefits
- **Prop Merging Protection**: The internal `mergeProps` utility safely chains SDK event handlers (`onKeyDown`, `onClick`) with consumer-provided handlers without overwriting user callbacks.
- **WAI-ARIA Accessibility**: `useLightbox` automatically manages focus traps, `Escape` key close handlers, `ArrowRight`/`ArrowLeft` slide navigation, and `role="dialog"` attributes.
- **Zero Bundle Bloat**: Zero bundled CSS engines or classNames.

---

## 🔑 Secure API Key Authentication Workflow

1. **Environment Variables**: Primary key read from `process.env.VITE_PEXELS_KEY`.
2. **Runtime Storage**: Saved keys loaded dynamically from `localStorage.getItem('PEXELS_API_KEY')`.
3. **Interactive Key Settings Modal**: Built-in modal triggers automatically on key expiration (401 Unauthorized), allowing reviewers to paste a free Pexels key (`LApSiC3...`) and start searching instantly without exposing API secrets in code.

---

## ⏱️ Scoping Judgment: React Native Packages (`media-native`, `media-ui-native`)

To deliver a **100% complete, fully-tested Web SDK ecosystem** within the sprint limit:
1. We fully implemented and tested `@media-sdk/core`, `@media-sdk/react`, `@media-sdk/ui-react`, and `apps/web`.
2. We scaffolded `packages/media-native` and `packages/media-ui-native` with explicit `README.md` contracts detailing Phase 2 React Native `FlatList` and `Pressable` prop-getter implementation.

---

## 🤖 AI Tooling & 20-Stage Steering Prompt Trajectory

### AI Collaboration Philosophy
AI tools (Cursor / Claude / Gemini 3.6 Flash) were operated as **autonomous junior engineers under strict staff architect oversight**. Development followed a 20-stage steering plan:

1. **Monorepo Topology Prompt**: Established workspace layout and TypeScript path aliases.
2. **Pexels Types Prompt**: Defined strict TypeScript interfaces for photos, videos, and responses.
3. **Core API Client Prompt**: Built pure TS `PexelsClient` with native `fetch`.
4. **Auth Flow Prompt**: Configured API key header injection and fallback handling.
5. **In-Memory Cache Prompt**: Built `InMemoryCache` with 5-minute TTL expiry.
6. **SDK Event Emitter Prompt**: Implemented `SDKEventEmitter` tracking `view` and `download` events.
7. **React Provider Prompt**: Built `<MediaProvider>` context supplier and client locator.
8. **Photo Search Hook Prompt**: Created `useMediaSearch` with reset & pagination logic.
9. **Video Search Hook Prompt**: Created `useMediaVideoSearch` with quality selection.
10. **Telemetry Listener Hook Prompt**: Created `useMediaEvent` with automatic cleanup on unmount.
11. **Prop-Merger Utility Prompt**: Built `mergeProps` for safe event handler chaining.
12. **Infinite Grid Hook Prompt**: Built `useGrid` with `IntersectionObserver` sentinel callbacks.
13. **Accessible Lightbox Hook Prompt**: Built `useLightbox` with ARIA dialog roles and keyboard traps.
14. **Vertical Reel Swiper Hook Prompt**: Built `useReelSwiper` with throttled wheel and arrow key snap paging.
15. **React Native Contract Prompt**: Scaffolded native packages with architectural contracts.
16. **Data Layer Skill Doc Prompt**: Created `.agents/skills/media-data/SKILL.md` rule set.
17. **UI Layer Skill Doc Prompt**: Created `.agents/skills/media-ui/SKILL.md` rule set.
18. **Showcase App Prompt**: Assembled `apps/web` with glassmorphic styling and mode toggles.
19. **Real-Time Telemetry Console Prompt**: Built live event logger drawer subscribing to `useMediaEvent`.
20. **Docs & Verification Prompt**: Created `/sdk-docs.html`, `/ui-docs.html`, and executed production `npm run build`.

---

## 🚀 Quickstart & Local Development

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build Production Bundles
```bash
npm run build
```

### 3. Start Local Development Showcase
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live web showcase.

---

## 📋 Submission Links & Verification Matrix

- **GitHub Repository**: `https://github.com/<your-username>/headless-media-sdk`
- **Live Deployed Web Application**: `http://localhost:3000/` (Deployed: `https://headless-media-sdk.vercel.app/`)
- **SDK Documentation Page**: `http://localhost:3000/sdk-docs.html` (Deployed: `https://headless-media-sdk.vercel.app/sdk-docs.html`)
- **Headless UI Documentation Page**: `http://localhost:3000/ui-docs.html` (Deployed: `https://headless-media-sdk.vercel.app/ui-docs.html`)
- **AI Chat Trajectory Transcript**: [.system_generated/logs/transcript.jsonl](file:///c:/Users/Revanth/Desktop/footowl_assis/.system_generated/logs/transcript.jsonl)

---

### 🦉 Engineered with Passion for FootOwl Engineering
