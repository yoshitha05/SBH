"use client";

import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { msalConfig } from "@/lib/msalConfig";

const msalInstance = new PublicClientApplication(msalConfig);

let initPromise: Promise<void> | null = null;
function ensureInitialized() {
  if (!initPromise) {
    initPromise = msalInstance.initialize().then(() => {
      msalInstance.addEventCallback((event) => {
        if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
          // @ts-ignore
          msalInstance.setActiveAccount(event.payload.account);
        }
      });
    });
  }
  return initPromise;
}

export default function MsalClientProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureInitialized().then(() => setReady(true));
  }, []);

  if (!ready) {
    return null;
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
