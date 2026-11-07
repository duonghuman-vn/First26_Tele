import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const setupKey = request.headers.get("x-setup-key");
  if (!process.env.WEBHOOK_SETUP_KEY || setupKey !== process.env.WEBHOOK_SETUP_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!appUrl || !token || !secret) {
    return NextResponse.json({ error: "Missing app URL, bot token, or webhook secret" }, { status: 500 });
  }
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: `${appUrl}/api/telegram/webhook`,
      secret_token: secret,
      allowed_updates: ["message", "edited_message"],
    }),
  });
  const result = await response.json();
  return NextResponse.json(result, { status: response.ok ? 200 : 502 });
}
