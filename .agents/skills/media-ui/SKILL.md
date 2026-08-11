---
name: media-ui-skill
description: Teaches AI coding assistants how to use the strictly headless @media-sdk/ui-react prop-getters pattern for grids, lightboxes, and vertical swipers.
---

# Media SDK Headless UI Skill (`@media-sdk/ui-react`)

This skill instructs AI assistants on building accessible, un-styled UI components using the Prop-Getters pattern.

## 1. Infinite Scroll Grid: `useGrid`
```tsx
import { useGrid } from '@media-sdk/ui-react';

function GridView({ items, loadMore, hasMore, loading }) {
  const { getContainerProps, getItemProps, getSentinelProps } = useGrid({
    fetchNextPage: loadMore,
    hasNextPage: hasMore,
    isLoading: loading,
  });

  return (
    <div {...getContainerProps({ className: 'custom-grid-layout' })}>
      {items.map((item, idx) => (
        <div key={item.id} {...getItemProps(idx, { className: 'grid-card' })}>
          <img src={item.imageUrl} alt={item.title} />
        </div>
      ))}
      <div {...getSentinelProps()} />
    </div>
  );
}
```

## 2. Accessible Lightbox: `useLightbox`
```tsx
import { useLightbox } from '@media-sdk/ui-react';

function LightboxModal({ items }) {
  const {
    isOpen,
    activeIndex,
    getOverlayProps,
    getContentProps,
    getCloseButtonProps,
    getNextButtonProps,
    getPrevButtonProps
  } = useLightbox({ totalItems: items.length });

  if (!isOpen) return null;

  return (
    <div {...getOverlayProps({ className: 'modal-overlay' })}>
      <div {...getContentProps({ className: 'modal-dialog' })}>
        <img src={items[activeIndex].src} alt="" />
        <button {...getPrevButtonProps()}>Prev</button>
        <button {...getNextButtonProps()}>Next</button>
        <button {...getCloseButtonProps()}>Close</button>
      </div>
    </div>
  );
}
```

## ⛔ CRITICAL ANTI-PATTERNS (WHAT NOT TO DO)
- ❌ **DO NOT** import `@media-sdk/core` or Pexels types inside headless UI components.
- ❌ **DO NOT** add inline CSS styles or classNames inside `@media-sdk/ui-react` hooks.
