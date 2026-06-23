// lib/msalConfig.ts

import { Configuration, PopupRequest } from "@azure/msal-browser";

// ── Your real Azure app registration values ──
const CLIENT_ID = "56cc8a67-0993-471a-acbe-6d181c858d26";
const TENANT_ID = "2a2e3830-6b26-4f95-8e42-e25c75cc4da5";

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: typeof window !== "undefined" ? window.location.origin : "https://localhost:3000",
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

// Scopes needed: read/write files in OneDrive for Business + basic profile
export const loginRequest: PopupRequest = {
  scopes: ["Files.ReadWrite", "Sites.ReadWrite.All", "User.Read"],
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphDriveEndpoint: "https://graph.microsoft.com/v1.0/me/drive",
};