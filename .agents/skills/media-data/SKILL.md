---
name: media-data-skill
description: Teaches AI coding assistants how to correctly consume the @media-sdk/react wrapper layer, context provider, authentication, search hooks, and telemetry event emitter.
---

# Media SDK Data & Telemetry Skill (`@media-sdk/react`)

This skill instructs AI assistants on how to connect applications to the Media SDK data layer.

## 1. Provider Setup
Always wrap the application root inside `<MediaProvider>`:

```tsx
import { MediaProvider } from '@media-sdk/react';

export function RootApp() {
  return (
    <MediaProvider apiKey={process.env.VITE_PEXELS_KEY}>
      <App />
    </MediaProvider>
  );
}
```

## 2. Searching Photos and Videos
Use `useMediaSearch` for photos and `useMediaVideoSearch` for video content:

```tsx
import { useMediaSearch, useMediaVideoSearch } from '@media-sdk/react';

function MediaFeed({ query }: { query: string }) {
  const { data: photos, loading, loadMore, hasMore } = useMediaSearch(query);
  const { data: videos } = useMediaVideoSearch(query);

  return (
    <div>
      {photos.map(p => <img key={p.id} src={p.src.medium} alt={p.alt} />)}
    </div>
  );
}
```

## 3. Telemetry Event Emitter
Subscribe to SDK events using `useMediaEvent`:

```tsx
import { useMediaEvent } from '@media-sdk/react';

function AnalyticsListener() {
  useMediaEvent('view', (payload) => {
    console.log('User viewed item:', payload.media.id);
  });

  useMediaEvent('download', (payload) => {
    console.log('User downloaded item:', payload.media.id);
  });

  return null;
}
```

## ⛔ CRITICAL ANTI-PATTERNS (WHAT NOT TO DO)
- ❌ **DO NOT** import `@media-sdk/core` or instantiate `new PexelsClient()` inside React components.
- ❌ **DO NOT** import `@media-sdk/ui-react` inside data hooks or providers.
