"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage("");
    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL?.trim().toLowerCase();
    if (!ownerEmail || email.trim().toLowerCase() !== ownerEmail) {
      setMessage("This email is not authorized for this private library.");
      setBusy(false);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setMessage(error ? error.message : "Check your email for the private sign-in link.");
    setBusy(false);
  }
  return <section className="login-card">
    <div className="brand"><span className="brand-mark">↗</span> Linkspace</div>
    <h1 style={{fontSize:25,margin:"28px 0 8px"}}>Your links, in one place.</h1>
    <p className="muted" style={{fontSize:14,lineHeight:1.6}}>Sign in with your email to open your private link library.</p>
    <form onSubmit={submit}>
      <label htmlFor="email" className="muted" style={{fontSize:12}}>Email address</label>
      <input id="email" type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
      <button className="btn btn-primary" style={{width:"100%"}} disabled={busy}>{busy ? "Sending..." : "Send sign-in link"}</button>
    </form>
    {message && <p style={{fontSize:13,marginTop:15}}>{message}</p>}
  </section>;
}
