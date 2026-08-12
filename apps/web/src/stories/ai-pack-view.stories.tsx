import type { Meta, StoryObj } from '@storybook/react';
import { PACK_SECTION_REQUIRED, PACK_SECTION_TITLE, type AIPack } from '@loquia/domain';
import { AIPackView } from '@/components/product/ai-pack-view';

function pack(language: string): AIPack {
  return {
    meetingId: 'm1',
    language,
    sections: [
      {
        key: 'purpose',
        title: PACK_SECTION_TITLE.purpose,
        required: PACK_SECTION_REQUIRED.purpose,
        confidence: 'inferred',
        lines: [{ text: 'Discuss pilot scope, integration requirements and commercial conditions.' }],
      },
      {
        key: 'explicitDecisions',
        title: PACK_SECTION_TITLE.explicitDecisions,
        required: PACK_SECTION_REQUIRED.explicitDecisions,
        confidence: 'explicit',
        lines: [{ text: 'The pilot will start with one business unit.' }],
      },
      {
        key: 'importantStatements',
        title: PACK_SECTION_TITLE.importantStatements,
        required: PACK_SECTION_REQUIRED.importantStatements,
        confidence: 'explicit',
        lines: [
          { text: 'João Silva: “Sem a integração, não acho que a gente consiga rodar o piloto direito.”', atSeconds: 1122 },
        ],
      },
      {
        key: 'ambiguities',
        title: PACK_SECTION_TITLE.ambiguities,
        required: PACK_SECTION_REQUIRED.ambiguities,
        confidence: 'uncertain',
        lines: [{ text: 'The final launch date was discussed but not formally confirmed.' }],
      },
    ],
  };
}

const meta: Meta<typeof AIPackView> = {
  title: 'Product/AIPackView',
  component: AIPackView,
  args: { pack: pack('en-US') },
};
export default meta;
type Story = StoryObj<typeof AIPackView>;

export const Default: Story = {};
export const Portuguese: Story = { args: { pack: pack('pt-BR') } };
export const Empty: Story = {
  args: { pack: { meetingId: 'm1', language: 'en-US', sections: [] } },
};
