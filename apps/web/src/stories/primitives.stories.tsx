import type { Meta, StoryObj } from '@storybook/react';
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@loquia/ui';

const meta: Meta = {
  title: 'UI/Primitives',
};
export default meta;
type Story = StoryObj;

export const Badges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="destructive">Error</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const CardExample: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Roadmap Q3</CardTitle>
      </CardHeader>
      <CardContent>Prioridade Acme, riscos de dados, próximos passos.</CardContent>
    </Card>
  ),
};

export const LoadingSkeleton: Story = {
  render: () => (
    <div className="max-w-sm space-y-2">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-24" />
    </div>
  ),
};
