/**
 * @file packages/media-react/src/index.ts
 * @description Thin React state management wrapper around @media-sdk/core.
 * FATAL ERROR CHECK: NO IMPORTS FROM @media-sdk/ui-react ALLOWED HERE.
 */

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback, useRef } from 'react';

declare const process: { env?: Record<string, string | undefined> } | undefined;

import {
  PexelsClient,
  PexelsClientOptions,
  PexelsPhoto,
  SearchOptions,
  TrendingOptions,
  SDKEventPayloadMap,
  SDKEventCallback,
} from 'media-core';

// Re-export core types for convenience
export * from 'media-core';

// ==========================================
// MEDIA CONTEXT & PROVIDER
// ==========================================

interface MediaContextValue {
  client: PexelsClient;
}

const MediaContext = createContext<MediaContextValue | null>(null);

export interface MediaProviderProps {
  apiKey?: string;
  baseUrl?: string;
  client?: PexelsClient;
  children: React.ReactNode;
}

export const MediaProvider: React.FC<MediaProviderProps> = ({ apiKey, baseUrl, client, children }) => {
  const pexelsClient = useMemo(() => {
    if (client) return client;
    const key = apiKey || (typeof process !== 'undefined' ? process.env?.VITE_PEXELS_KEY : undefined);
    if (!key) {
      console.warn('[MediaProvider] No API key provided. Using fallback client mode.');
      return new PexelsClient({ apiKey: 'DEMO_KEY_FALLBACK' });
    }
    return new PexelsClient({ apiKey: key, baseUrl });
  }, [apiKey, baseUrl, client]);

  const value = useMemo(() => ({ client: pexelsClient }), [pexelsClient]);

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
};

export const usePexelsClient = (): PexelsClient => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('[usePexelsClient] Must be used within a <MediaProvider>');
  }
  return context.client;
};

// ==========================================
// SEARCH HOOK
// ==========================================

export interface UseMediaSearchResult {
  data: PexelsPhoto[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  page: number;
  totalResults: number;
  reset: () => void;
}

export function useMediaSearch(
  query: string,
  options?: Omit<SearchOptions, 'page'>
): UseMediaSearchResult {
  const client = usePexelsClient();
  const [data, setData] = useState<PexelsPhoto[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const queryRef = useRef(query);
  const optionsRef = useRef(options);

  // Reset pagination state when query changes
  useEffect(() => {
    queryRef.current = query;
    optionsRef.current = options;
    setData([]);
    setPage(1);
    setError(null);
    setHasMore(true);
    setTotalResults(0);
  }, [query, JSON.stringify(options)]);

  const fetchPage = useCallback(
    async (targetPage: number, isAppend: boolean) => {
      const currentQuery = queryRef.current;
      if (!currentQuery || currentQuery.trim() === '') {
        setData([]);
        setLoading(false);
        setHasMore(false);
        setTotalResults(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await client.search(currentQuery, {
          ...optionsRef.current,
          page: targetPage,
        });

        setData((prev) => (isAppend ? [...prev, ...response.photos] : response.photos));
        setTotalResults(response.total_results);
        setHasMore(Boolean(response.next_page) && (targetPage * (optionsRef.current?.perPage ?? 15)) < response.total_results);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  useEffect(() => {
    if (query && query.trim() !== '') {
      fetchPage(page, page > 1);
    }
  }, [query, page, fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setError(null);
    setHasMore(true);
    setTotalResults(0);
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    page,
    totalResults,
    reset,
  };
}

// ==========================================
// TRENDING HOOK
// ==========================================

export interface UseMediaTrendingResult {
  data: PexelsPhoto[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  page: number;
}

export function useMediaTrending(
  options?: Omit<TrendingOptions, 'page'>
): UseMediaTrendingResult {
  const client = usePexelsClient();
  const [data, setData] = useState<PexelsPhoto[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchPage = useCallback(
    async (targetPage: number, isAppend: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const response = await client.getTrending({
          ...options,
          page: targetPage,
        });

        setData((prev) => (isAppend ? [...prev, ...response.photos] : response.photos));
        setHasMore(Boolean(response.next_page));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [client, JSON.stringify(options)]
  );

  useEffect(() => {
    fetchPage(page, page > 1);
  }, [page, fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    page,
  };
}

// ==========================================
// VIDEO SEARCH HOOK
// ==========================================

export interface UseMediaVideoSearchResult {
  data: import('@media-sdk/core').PexelsVideo[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  page: number;
  totalResults: number;
}

export function useMediaVideoSearch(
  query: string,
  options?: Omit<SearchOptions, 'page'>
): UseMediaVideoSearchResult {
  const client = usePexelsClient();
  const [data, setData] = useState<import('@media-sdk/core').PexelsVideo[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchPage = useCallback(
    async (targetPage: number, isAppend: boolean) => {
      if (!query || query.trim() === '') {
        setData([]);
        setLoading(false);
        setHasMore(false);
        setTotalResults(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await client.searchVideos(query, {
          ...options,
          page: targetPage,
        });

        setData((prev) => (isAppend ? [...prev, ...response.videos] : response.videos));
        setTotalResults(response.total_results);
        setHasMore(Boolean(response.next_page) && (targetPage * (options?.perPage ?? 15)) < response.total_results);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [client, query, JSON.stringify(options)]
  );

  useEffect(() => {
    setData([]);
    setPage(1);
  }, [query]);

  useEffect(() => {
    fetchPage(page, page > 1);
  }, [page, fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    page,
    totalResults,
  };
}

// ==========================================
// EVENT LISTENER HOOK
// ==========================================

export function useMediaEvent<K extends string>(
  eventName: K,
  callback: SDKEventCallback<K extends keyof SDKEventPayloadMap ? SDKEventPayloadMap[K] : any>
): void {
  const client = usePexelsClient();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (payload: any) => {
      if (callbackRef.current) {
        callbackRef.current(payload);
      }
    };

    client.on(eventName, handler);
    return () => {
      client.off(eventName, handler);
    };
  }, [client, eventName]);
}
