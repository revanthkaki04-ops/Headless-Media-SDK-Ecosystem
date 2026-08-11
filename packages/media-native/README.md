# @media-sdk/native

## Architectural Contract & Scoping Notice

`@media-sdk/native` is designed to mirror `@media-sdk/react` identically in terms of API surface and contract, consuming `@media-sdk/core` while integrating with React Native state and event primitives.

### Scoping Judgment
To prioritize a complete, production-grade, zero-placeholder Web implementation (`@media-sdk/core`, `@media-sdk/react`, `@media-sdk/ui-react`, `apps/web`) within the designated 8-hour sprint, the React Native integration target has been intentionally scoped into Phase 2.

### Contract Expectations
When fully implemented, `@media-sdk/native` will:
- Re-export `@media-sdk/core` and provide `<MediaProviderNative>` using React Native Context.
- Expose identical hooks (`useMediaSearch`, `useMediaTrending`, `useMediaEvent`).
- Maintain zero dependencies on web DOM APIs.
