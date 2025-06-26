// app/providers.tsx
"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { Provider } from "react-redux";
import { store } from "./store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
    return null;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Provider store={store}>{children}</Provider>
    </GoogleOAuthProvider>
  );
}
