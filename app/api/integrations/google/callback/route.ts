import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * Callback do OAuth do Google Ads
 * 
 * Esta rota recebe o código de autorização do Google após o usuário
 * fazer login e autorizar o app. O código é trocado por access token
 * e refresh token que são salvos no banco de dados.
 * 
 * Fluxo:
 * 1. Google redireciona para esta rota com o código
 * 2. Código é trocado por access token e refresh token
 * 3. Tokens são salvos no Supabase
 * 4. Evento é enviado para o webhook Manus
 * 5. Usuário é redirecionado de volta para o app
 */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    // Verificar se houve erro na autorização
    if (error) {
      console.error("[Google Callback] Erro na autorização:", error);
      return NextResponse.redirect(
        new URL(`/integrations?error=google_auth_failed&message=${encodeURIComponent(error)}`, url.origin)
      );
    }

    // Validar código
    if (!code) {
      console.error("[Google Callback] Código de autorização não fornecido");
      return NextResponse.json(
        { error: "missing_code", message: "Código de autorização não fornecido" },
        { status: 400 }
      );
    }

    console.log("[Google Callback] Código recebido, trocando por token...");

    // Validar variáveis de ambiente
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      console.error("[Google Callback] Variáveis de ambiente não configuradas");
      return NextResponse.json(
        { error: "config_error", message: "Configuração do Google incompleta" },
        { status: 500 }
      );
    }

    // Trocar código por access token e refresh token
    const tokenRes = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
          code
        })
      }
    );

    const tokenJson = await tokenRes.json();

    // Verificar erro na troca de token
    if (tokenJson.error) {
      console.error("[Google Callback] Erro ao trocar código por token:", tokenJson.error);
      return NextResponse.json(
        { 
          error: "token_exchange_failed", 
          message: tokenJson.error_description || "Falha ao trocar código por token",
          details: tokenJson.error
        },
        { status: 400 }
      );
    }

    const accessToken = tokenJson.access_token;
    const refreshToken = tokenJson.refresh_token;

    if (!accessToken) {
      console.error("[Google Callback] Access token não retornado pelo Google");
      return NextResponse.json(
        { error: "no_token", message: "Access token não retornado pelo Google" },
        { status: 500 }
      );
    }

    console.log("[Google Callback] Tokens obtidos com sucesso");
    console.log("[Google Callback] Refresh token presente:", !!refreshToken);

    // Obter informações do usuário autenticado
    const supabase = supabaseServer();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn("[Google Callback] Usuário não autenticado, salvando token sem tenant_id");
    }

    // Salvar tokens no Supabase
    console.log("[Google Callback] Salvando tokens no banco de dados...");
    
    const { data: integration, error: dbError } = await supabase
      .from("integrations")
      .insert({
        tenant_id: user?.id || null,
        platform: "google",
        access_token: accessToken,
        refresh_token: refreshToken || null,
        status: "connected",
        connected_at: new Date().toISOString(),
        expires_at: tokenJson.expires_in 
          ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
          : null,
        metadata: {
          scope: tokenJson.scope,
          token_type: tokenJson.token_type
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Google Callback] Erro ao salvar no banco:", dbError);
      return NextResponse.json(
        { 
          error: "database_error", 
          message: "Erro ao salvar integração",
          details: dbError
        },
        { status: 500 }
      );
    }

    console.log("[Google Callback] Integração salva com sucesso:", integration?.id);

    // Notificar webhook Manus (se configurado)
    if (process.env.MANUS_WEBHOOK_URL) {
      try {
        console.log("[Google Callback] Notificando webhook Manus...");
        
        const webhookRes = await fetch(process.env.MANUS_WEBHOOK_URL, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({
            event_type: "integration_completed",
            flow_id: "flow_1_google_" + Date.now(),
            data: {
              platform: "google",
              tenant_id: user?.id || null,
              integration_id: integration?.id,
              status: "connected",
              has_refresh_token: !!refreshToken
            },
            timestamp: new Date().toISOString(),
            status: "success"
          })
        });

        if (webhookRes.ok) {
          console.log("[Google Callback] Webhook notificado com sucesso");
        } else {
          console.warn("[Google Callback] Falha ao notificar webhook:", await webhookRes.text());
        }
      } catch (webhookError) {
        console.error("[Google Callback] Erro ao notificar webhook:", webhookError);
        // Não falhar a integração se o webhook falhar
      }
    } else {
      console.warn("[Google Callback] MANUS_WEBHOOK_URL não configurado, pulando notificação");
    }

    // Redirecionar usuário de volta para o app
    const redirectUrl = new URL("/integrations?connected=google", url.origin);
    console.log("[Google Callback] Redirecionando para:", redirectUrl.toString());

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error("[Google Callback] Erro inesperado:", error);
    return NextResponse.json(
      { 
        error: "internal_error", 
        message: "Erro interno ao processar callback",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
