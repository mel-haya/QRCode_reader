"use client";
import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

function Providers({ children }: PropsWithChildren) {
  const queryClient = new QueryClient();

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AppRouterCacheProvider>
  );
}

export default Providers;
