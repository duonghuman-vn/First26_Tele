import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMetadata } from "@/lib/metadata";
import { classifyLink, makeTags } from "@/lib/classify";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 15;

type TelegramMessage = {
  message_id: number;
  text?: string;
  caption?: string;
  chat: { id: number };
  from?: { id: number };
};

function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>()]+/i);
  if (!match) return null;
  const cleaned = match[0].replace(/[.,!?;:]+$/, "");
  try {
    const url = new URL(cleaned);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch { return null; }
}

function isPrivateAddress(hostname: string) {
  const h = hostname.toLowerCase();
  return h === "localhost" || h.endsWith(".local") ||
    /^(127\.|10\.|192\.168\.|0\.|169\.254\.)/.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h);
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update = await request.json();
    const message: TelegramMessage | undefined = update.message || update.edited_message;
    if (!message) return NextResponse.json({ ok: true });

    const allowed = (process.env.TELEGRAM_ALLOWED_USER_IDS || "")
      .split(",").map(v=>v.trim()).filter(Boolean);
    const senderId = message.from?.id?.toString();
    if (!senderId || !allowed.includes(senderId)) {
      await sendTelegramMessage(message.chat.id, "This is a private bot. Your Telegram account is not authorized.");
      return NextResponse.json({ ok: true });
    }

    const text = message.text || message.caption || "";
    const urlString = extractUrl(text);
    if (!urlString) {
      await sendTelegramMessage(message.chat.id, "Send me a link starting with https:// and I'll save it to your library.");
      return NextResponse.json({ ok: true });
    }

    const parsed = new URL(urlString);
    if (isPrivateAddress(parsed.hostname)) {
      await sendTelegramMessage(message.chat.id, "I can't save private network or local addresses.");
      return NextResponse.json({ ok: true });
    }

    const supabase = createAdminClient();
    const { data: existing } = await supabase.from("links").select("id").eq("normalized_url", urlString).maybeSingle();
    if (existing) {
      await sendTelegramMessage(message.chat.id, "This link is already in your library. No duplicate was added.");
      return NextResponse.json({ ok: true });
    }

    const metadata = await fetchMetadata(urlString);
    const category = classifyLink(urlString, metadata.title, metadata.description || "");
    const tags = makeTags(urlString, metadata.title, category);
    const { error } = await supabase.from("links").insert({
      url: urlString,
      normalized_url: urlString,
      title: metadata.title,
      description: metadata.description,
      image_url: metadata.image_url,
      domain: metadata.domain,
      category,
      tags,
      is_favorite: false,
      telegram_user_id: senderId,
    });
    if (error) {
      if (error.code === "23505") {
        await sendTelegramMessage(message.chat.id, "This link is already saved.");
      } else {
        console.error("Supabase insert error", error);
        await sendTelegramMessage(message.chat.id, "I couldn't save this link. Please try again later.");
      }
      return NextResponse.json({ ok: true });
    }

    await sendTelegramMessage(
      message.chat.id,
      `Saved to your library!\n\n<b>${escapeHtml(metadata.title)}</b>\n${escapeHtml(metadata.domain)}\nCategory: <b>${escapeHtml(category)}</b>\nTags: ${tags.map(escapeHtml).join(", ")}`
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]!));
}
