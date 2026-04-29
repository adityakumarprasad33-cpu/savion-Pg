"use client";

import { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/lib/context/AuthContext";
import { GlobalLoader } from "./GlobalLoader";

// We no longer block the entire app from rendering. 
// Firebase will initialize in the background. The Navbar will show a loading skeleton.
function AuthLoaderGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Wrap the whole app in this
export function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthLoaderGuard>
        {children}
      </AuthLoaderGuard>
    </AuthProvider>
  );
}
