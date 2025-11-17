"use client";

import { supabase } from "@/src/lib/supabaseClient";
import Button from "../components/ui/Button";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Bem-vindo ao Loquia!</h1>

      <Button className="mt-6" onClick={logout}>
        Sair
      </Button>
    </div>
  );
}
