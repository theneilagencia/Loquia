import { NextResponse } from "next/server";

/**
 * Rota de OAuth do Google Ads
 * 
 * Esta rota inicia o fluxo de autenticação OAuth com o Google.
 * O usuário é redirecionado para a página de login do Google, onde autoriza o app.
 * 
 * Fluxo:
 * 1. Usuário clica em "Conectar Google Ads"
 * 2. É redirecionado para esta rota
 * 3. Esta rota redireciona para o OAuth do Google
 * 4. Usuário faz login e autoriza
 * 5. Google redireciona para o callback com o código
 */

export async function GET() {
  // Validar variáveis de ambiente
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID não configurado" },
      { status: 500 }
    );
  }

  if (!process.env.GOOGLE_REDIRECT_URI) {
    return NextResponse.json(
      { error: "GOOGLE_REDIRECT_URI não configurado" },
      { status: 500 }
    );
  }

  if (!process.env.GOOGLE_SCOPES) {
    return NextResponse.json(
      { error: "GOOGLE_SCOPES não configurado" },
      { status: 500 }
    );
  }

  // Parâmetros do OAuth
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    access_type: "offline", // Solicita refresh token
    include_granted_scopes: "true", // Inclui scopes já autorizados
    prompt: "consent", // Força tela de consentimento para garantir refresh token
    scope: process.env.GOOGLE_SCOPES
  });

  // URL de autorização do Google OAuth 2.0
  const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString();

  console.log("[Google OAuth] Redirecionando para:", authUrl);

  // Redirecionar para a página de autorização do Google
  return NextResponse.redirect(authUrl);
}
