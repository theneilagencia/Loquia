import type { Meta, StoryObj } from '@storybook/react';
import { Waveform } from '@/components/product/waveform';

const peaks = Array.from({ length: 40 }, (_, i) => 0.3 + 0.6 * Math.abs(Math.sin(i / 3)));

const meta: Meta<typeof Waveform> = {
  title: 'Product/Waveform',
  component: Waveform,
  args: { peaks },
};
export default meta;
type Story = StoryObj<typeof Waveform>;

export const Default: Story = {};
export const WithProgress: Story = { args: { progress: 0.5 } };
export const Live: Story = { args: { live: true } };
