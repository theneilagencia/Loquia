import { supabaseServer } from "@/lib/supabase-server";

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Redirecionando...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-medium">Bem-vindo, {user.email}</h1>
      <p className="text-gray-600 mt-2">Dashboard LOQUIA (V1)</p>
    </div>
  );
}
