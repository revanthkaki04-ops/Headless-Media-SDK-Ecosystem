# @media-sdk/ui-native

## Architectural Contract & Scoping Notice

`@media-sdk/ui-native` is designed to mirror `@media-sdk/ui-react` by exporting headless prop-getter hooks specifically formatted for React Native components (e.g., returning props for `FlatList`, `Modal`, `Pressable`, `View`).

### Scoping Judgment
To prioritize a complete, production-grade Web implementation (`@media-sdk/core`, `@media-sdk/react`, `@media-sdk/ui-react`, `apps/web`) within the 8-hour sprint limit, the React Native UI binding layer has been intentionally scoped into Phase 2.

### Contract Expectations
When fully implemented, `@media-sdk/ui-native` will:
- Export `useGridNative()`, `useLightboxNative()`, and `useReelSwiperNative()`.
- Return native prop-getters (`getFlatListProps`, `getPressableProps`, `getModalProps`).
- Contain ZERO React Native `StyleSheet` objects or predefined styles, maintaining strict headlessness.
