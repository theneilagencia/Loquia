export * from './config';
import enUS from './messages/en-US.json';
import ptBR from './messages/pt-BR.json';
import type { ActiveLocale } from '@loquia/domain';

export type Messages = typeof ptBR;

export const messages: Record<ActiveLocale, Messages> = {
  'pt-BR': ptBR,
  'en-US': enUS as Messages,
};
