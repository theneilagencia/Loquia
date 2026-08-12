import type { Meta, StoryObj } from '@storybook/react';
import type { ProcessingJob } from '@loquia/domain';
import { ProcessingTimeline } from '@/components/product/processing-timeline';

const base: ProcessingJob = {
  id: 'j', workspaceId: 'w1', meetingId: 'm', type: 'transcription',
  status: 'running', stage: 'transcribing', progress: 33, attempt: 1, maxAttempts: 3,
  createdAt: '2026-08-12T10:00:00.000Z', updatedAt: '2026-08-12T10:00:00.000Z',
};

const meta: Meta<typeof ProcessingTimeline> = {
  title: 'Product/ProcessingTimeline',
  component: ProcessingTimeline,
};
export default meta;
type Story = StoryObj<typeof ProcessingTimeline>;

export const Running: Story = { args: { job: base } };
export const Completed: Story = {
  args: { job: { ...base, status: 'completed', stage: 'ready', progress: 100 } },
};
export const Failed: Story = {
  args: {
    job: { ...base, status: 'failed', stage: 'preparing_audio', progress: 12, errorMessage: 'Audio could not be decoded.' },
  },
};
