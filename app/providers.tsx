"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { refreshSession } from "@/lib/api";
import { getStoredRefreshToken } from "@/lib/token";
import { useAuth } from "@/store/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  useEffect(() => {
    if (getStoredRefreshToken()) {
      void refreshSession();
    } else {
      useAuth.getState().setSession(null);
    }
  }, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
