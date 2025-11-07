import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://nmqhfvs3-8000.inc1.devtunnels.ms/api/v1";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJqb2huLmRvZUBiYW5rLmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc2MjI2ODg2OSwidHlwZSI6ImFjY2VzcyJ9.o1j3gQgNFV00Za0dglrIl8G47EZTXDlI_KlF4wxvb4M";


async function handleFavorite(
  method: "POST" | "DELETE",
  tableId: string
): Promise<NextResponse> {
  try {
    const upstreamUrl = `${API_BASE_URL}/tables/${tableId}/favorite`;
    console.log(`[Proxy] ${method} ${upstreamUrl}`);

    const res = await fetch(upstreamUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    // Log status + body text for debugging
    const text = await res.text();
    console.log(`[Upstream] Status: ${res.status}`, text);

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream API error", statusText: res.statusText, data },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Proxy error]", error);
    return NextResponse.json(
      {
        error: "Failed to reach upstream API",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tableId: string } }
) {
  return handleFavorite("POST", params.tableId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tableId: string } }
) {
  return handleFavorite("DELETE", params.tableId);
}