"use client";
import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e: any) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Conta criada! Verifique seu e-mail para confirmar.");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto pt-24 px-6">
      <H2>Criar conta</H2>
      <Body>Preencha os campos abaixo:</Body>

      <form onSubmit={handleSignup} className="mt-8 space-y-6">

        <input
          type="email"
          placeholder="Seu e-mail"
          className="w-full border border-gray-300 rounded-lg px-4 py-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Senha"
          className="w-full border border-gray-300 rounded-lg px-4 py-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button size="lg" className="w-full" type="submit">
          {loading ? "Criando..." : "Criar conta"}
        </Button>

        {message && (
          <p className="text-center text-sm text-gray-700 mt-4">{message}</p>
        )}
      </form>
    </div>
  );
}
