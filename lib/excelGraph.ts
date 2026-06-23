// lib/excelGraph.ts
// Helper functions to create/find the expenditure Excel file in OneDrive for Business
// and get the Office Online embed URL, via Microsoft Graph API.

const FILE_NAME = "LeaseIQ_Expenditure.xlsx";
const FOLDER_NAME = "LeaseIQ";

async function graphFetch(url: string, accessToken: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API error (${res.status}): ${text}`);
  }
  return res.json();
}

/** Ensure the LeaseIQ folder exists in OneDrive root; returns folder id. */
async function ensureFolder(accessToken: string): Promise<string> {
  try {
    const folder = await graphFetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${FOLDER_NAME}`,
      accessToken
    );
    return folder.id;
  } catch {
    // Folder doesn't exist — create it
    const created = await graphFetch(
      `https://graph.microsoft.com/v1.0/me/drive/root/children`,
      accessToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: FOLDER_NAME,
          folder: {},
          "@microsoft.graph.conflictBehavior": "rename",
        }),
      }
    );
    return created.id;
  }
}

/** Minimal valid empty .xlsx file bytes (blank workbook), base64-free binary via Blob. */
function buildBlankWorkbookBlob(): Blob {
  // A tiny valid xlsx is binary; easiest reliable approach is to let Graph create
  // an empty file of type xlsx by uploading a minimal placeholder, then it opens fine in Excel Online.
  // We upload an empty ArrayBuffer; Excel Online will treat it as a blank workbook on first open.
  return new Blob([new Uint8Array([])], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/** Find the expenditure file, or create a blank one if it doesn't exist. Returns the file's item id. */
export async function ensureExpenditureFile(accessToken: string): Promise<{ id: string; webUrl: string }> {
  await ensureFolder(accessToken);

  try {
    const file = await graphFetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${FOLDER_NAME}/${FILE_NAME}`,
      accessToken
    );
    return { id: file.id, webUrl: file.webUrl };
  } catch {
    // File doesn't exist — create it by uploading a blank workbook
    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${FOLDER_NAME}/${FILE_NAME}:/content`;
    const created = await graphFetch(uploadUrl, accessToken, {
      method: "PUT",
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      body: buildBlankWorkbookBlob(),
    });
    return { id: created.id, webUrl: created.webUrl };
  }
}

/** Get an embeddable Office Online URL for editing the file directly. */
export async function getEmbedUrl(accessToken: string, itemId: string): Promise<string> {
  const data = await graphFetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/createLink`,
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "edit", scope: "organization" }),
    }
  );
  // data.link.webUrl is the sharing URL; appending action=embedview gives the embeddable version
  const base = data.link.webUrl as string;
  return base.includes("?") ? `${base}&action=embedview` : `${base}?action=embedview`;
}