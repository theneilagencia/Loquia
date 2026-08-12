import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './theme';

function ThemeConsumer() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('dark')}>dark</button>
      <button onClick={() => setTheme('light')}>light</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  it('sets data-theme on the document root and persists the choice', async () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    await act(async () => {
      await userEvent.click(screen.getByText('dark'));
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(window.localStorage.getItem('loquia:theme')).toBe('dark');

    await act(async () => {
      await userEvent.click(screen.getByText('light'));
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
