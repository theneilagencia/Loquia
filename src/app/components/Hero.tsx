"use client";

import Section from "./ui/Section";
import { H1, Body } from "./ui/Typography";
import Button from "./ui/Button";
import Link from "next/link";

export default function Hero() {
  return (
    <Section className="pt-32 pb-28 bg-white">
      <div className="text-center max-w-4xl mx-auto">
        
        <H1>
          Sua empresa precisa existir na era da IA.
        </H1>

        <Body className="text-xl text-gray-700 max-w-2xl mx-auto mb-10">
          O Loquia Intent Engine conecta o seu negócio ao OpenAI Search, Perplexity, Claude e Google SGE — permitindo que sua marca seja recomendada sempre que alguém perguntar algo que você resolve.
        </Body>

        <Link href="/signup">
          <Button size="lg" className="px-10 py-5 text-lg">
            Criar minha Presença IA agora
          </Button>
        </Link>
      </div>
    </Section>
  );
}
