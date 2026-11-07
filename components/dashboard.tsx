"use client";

import { useMemo, useState } from "react";
import { Bookmark, ExternalLink, Link2, LogOut, Search, Layers3, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { LinkItem } from "@/lib/types";

const categories = ["All", "Design", "Development", "Learning", "Articles", "Video", "Inspiration", "Tools", "Other"];

export default function Dashboard({ initialLinks, email }: { initialLinks: LinkItem[]; email: string }) {
  const [links, setLinks] = useState(initialLinks);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(() => links.filter((link) => {
    const q = query.toLowerCase();
    const matches = !q || [link.title, link.description || "", link.domain, link.url, ...link.tags].join(" ").toLowerCase().includes(q);
    return matches && (category === "All" || link.category === category) && (!favoritesOnly || link.is_favorite);
  }), [links, query, category, favoritesOnly]);

  async function toggleFavorite(link: LinkItem) {
    setBusyId(link.id);
    const next = !link.is_favorite;
    const supabase = createClient();
    const { error } = await supabase.from("links").update({ is_favorite: next }).eq("id", link.id);
    if (!error) setLinks(current => current.map(item => item.id === link.id ? {...item, is_favorite: next} : item));
    setBusyId(null);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return <main className="shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">↗</span> Linkspace</div>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <span className="muted" style={{fontSize:12}}>{email}</span>
        <button className="btn" onClick={signOut} title="Sign out"><LogOut size={15}/></button>
      </div>
    </header>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:20,flexWrap:"wrap"}}>
      <div>
        <p className="muted" style={{fontSize:12,margin:"0 0 7px"}}>YOUR PERSONAL LIBRARY</p>
        <h1 style={{fontSize:30,letterSpacing:-1,margin:0}}>Saved links</h1>
        <p className="muted" style={{fontSize:13,margin:"8px 0 0"}}>Everything you send to your Telegram bot, organized automatically.</p>
      </div>
      <div style={{fontSize:12,color:"#858d98"}}><Sparkles size={14} style={{display:"inline",verticalAlign:"middle",marginRight:5}}/> Auto-organized library</div>
    </div>

    <section className="stats">
      <div className="stat"><span className="muted" style={{fontSize:12}}>Total links</span><strong>{links.length}</strong></div>
      <div className="stat"><span className="muted" style={{fontSize:12}}>Favorites</span><strong>{links.filter(l=>l.is_favorite).length}</strong></div>
      <div className="stat"><span className="muted" style={{fontSize:12}}>Categories</span><strong>{new Set(links.map(l=>l.category)).size}</strong></div>
    </section>

    <div className="toolbar">
      <div style={{position:"relative",flex:1,minWidth:220}}>
        <Search size={16} style={{position:"absolute",left:13,top:13,color:"#939aa4"}}/>
        <input className="search" style={{paddingLeft:39,width:"100%"}} placeholder="Search title, domain, tags..." value={query} onChange={e=>setQuery(e.target.value)}/>
      </div>
      <select className="select" value={category} onChange={e=>setCategory(e.target.value)}>
        {categories.map(c=><option key={c}>{c}</option>)}
      </select>
      <button className={`btn ${favoritesOnly ? "btn-primary" : ""}`} onClick={()=>setFavoritesOnly(v=>!v)}><Bookmark size={14} style={{display:"inline",marginRight:6,verticalAlign:"middle"}}/>Favorites</button>
    </div>

    <div style={{display:"flex",justifyContent:"space-between",marginBottom:13}}>
      <span style={{fontSize:13,fontWeight:600}}>{favoritesOnly ? "Favorites" : category === "All" ? "All links" : category}</span>
      <span className="muted" style={{fontSize:12}}>{visible.length} items</span>
    </div>

    {visible.length === 0 ? <div className="empty"><Layers3 size={26} style={{margin:"0 auto 12px"}}/><div style={{fontWeight:600,color:"#4c5561"}}>No links found</div><p style={{fontSize:13}}>Send a URL to your Telegram bot to add it here.</p></div> :
      <section className="grid">{visible.map(link=><article className="link-card" key={link.id}>
        {link.image_url ? <img className="thumb" src={link.image_url} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display="none";}}/> : <div className="thumb-empty"><Link2 size={28}/></div>}
        <div className="card-body">
          <h2 className="card-title">{link.title}</h2>
          <p className="card-desc">{link.description || link.url}</p>
          <div>{link.category && <span className="pill">{link.category}</span>}{link.tags.slice(0,3).map(tag=><span className="pill" key={tag}>#{tag}</span>)}</div>
          <div className="meta"><span>{link.domain}</span><span>{new Date(link.created_at).toLocaleDateString()}</span></div>
        </div>
        <div className="card-actions">
          <a href={link.url} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,color:"#515b68"}}>Open link <ExternalLink size={13}/></a>
          <button className={`icon-btn ${link.is_favorite ? "active" : ""}`} disabled={busyId===link.id} onClick={()=>toggleFavorite(link)} title="Toggle favorite"><Bookmark size={17} fill={link.is_favorite ? "currentColor" : "none"}/></button>
        </div>
      </article>)}</section>
    }
  </main>;
}
