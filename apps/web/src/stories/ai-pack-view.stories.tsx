import type { Meta, StoryObj } from '@storybook/react';
import type { AIPack } from '@loquia/domain';
import { AIPackView } from '@/components/product/ai-pack-view';

const pack: AIPack = {
  meetingId: 'm1',
  language: 'en-US',
  generatedAt: '2026-08-12T13:05:00.000Z',
  model: 'mock-1',
  version: 1,
  sections: [
    {
      key: 'decisions',
      items: [
        {
          id: 'd1',
          text: 'Prioritize the Acme integration before the end of August.',
          origin: 'explicit',
          confidence: 0.92,
          uncertain: false,
          evidence: [{ segmentId: 's3', quote: 'priorizar a integração da Acme', language: 'pt-BR', startSeconds: 22 }],
        },
      ],
    },
    {
      key: 'risks',
      items: [
        {
          id: 'r1',
          text: 'Delivery timeline may be tight given the data dependency.',
          origin: 'inferred',
          confidence: 0.45,
          uncertain: true,
          evidence: [{ segmentId: 's4', quote: 'se a equipe de dados não entregar', language: 'pt-BR', startSeconds: 34 }],
        },
      ],
    },
    { key: 'glossary', items: [] },
  ],
};

const meta: Meta<typeof AIPackView> = {
  title: 'Product/AIPackView',
  component: AIPackView,
  args: { pack, locale: 'en-US' },
};
export default meta;
type Story = StoryObj<typeof AIPackView>;

export const Default: Story = {};
export const Portuguese: Story = { args: { locale: 'pt-BR' } };
export const Empty: Story = {
  args: { pack: { ...pack, sections: [{ key: 'glossary', items: [] }] } },
};
