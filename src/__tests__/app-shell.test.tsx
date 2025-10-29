import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AppShell } from '@/components/layout/AppShell';

describe('AppShell layout', () => {
  it('wraps children with safe-area padding and renders navigation', () => {
    render(
      <MemoryRouter initialEntries={['/brief']}>
        <AppShell>
          <div data-testid="content">Hello layout</div>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('content')).toBeVisible();
    expect(screen.getByRole('link', { name: /score/i })).toBeInTheDocument();

    const nav = screen.getByRole('navigation');
    expect(nav.querySelector('.safe-area-inline')).not.toBeNull();
    expect(nav.querySelector('.safe-area-bottom')).not.toBeNull();
  });
});
