"use client";

import Section from "./ui/Section";
import { H2, Body } from "./ui/Typography";
import Button from "./ui/Button";
import Link from "next/link";

export default function IntentionEra() {
  return (
    <Section className="bg-white">
      <div className="max-w-4xl mx-auto text-center">
        
        <H2>A era da intenção</H2>

        <Body>
          Você precisa aparecer quando alguém pergunta algo que sua empresa resolve.
        </Body>

        <Body>
          Com o Loquia Intent Engine:
        </Body>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left shadow-sm max-w-xl mx-auto my-8">
          <p className="text-gray-700 leading-relaxed">
            ✔ sua empresa se torna recomendação ativa da IA <br />
            ✔ você aparece para pessoas com intenção real <br />
            ✔ seus leads chegam mais qualificados <br />
            ✔ você não disputa leilões de anúncios <br />
            ✔ você não depende de SEO <br />
            ✔ você não perde dinheiro com tráfego irrelevante
          </p>
        </div>

        <Body>
          Este é o novo canal de aquisição.  
          Ele já existe. E está aberto agora.
        </Body>

        <Link href="/signup">
          <Button size="lg" className="mt-8">
            Criar minha Presença IA agora
          </Button>
        </Link>

      </div>
    </Section>
  );
}
