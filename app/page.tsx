import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/dashboard";
import type { LinkItem } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("links").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return <Dashboard initialLinks={(data || []) as LinkItem[]} email={user.email || ""} />;
}
