import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';
import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    requestMagicLink: vi.fn(),
    verifyPin: vi.fn(),
  };
});

import { requestMagicLink, verifyPin } from '@/lib/api';
import { AuthPage } from '@/pages/AuthPage';

describe('AuthPage', () => {
  const requestMagicLinkMock = requestMagicLink as unknown as Mock;
  const verifyPinMock = verifyPin as unknown as Mock;

  beforeEach(() => {
    requestMagicLinkMock.mockReset();
    verifyPinMock.mockReset();
  });

  it('requests a magic link and shows success messaging', async () => {
    requestMagicLinkMock.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<AuthPage />);

    const emailInput = screen.getAllByLabelText(/email address/i)[0];
    await user.type(emailInput, 'judge@example.com');
    await user.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(requestMagicLinkMock).toHaveBeenCalledWith({ email: 'judge@example.com' });
    });

    expect(
      screen.getByText(/check your inbox for the secure link\. use it within 15 minutes\./i),
    ).toBeInTheDocument();
  });

  it('surfaces request errors from the magic link form', async () => {
    requestMagicLinkMock.mockRejectedValue(new Error('network fail'));

    const user = userEvent.setup();
    render(<AuthPage />);

    const emailInput = screen.getAllByLabelText(/email address/i)[0];
    await user.type(emailInput, 'judge@example.com');
    await user.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(requestMagicLinkMock).toHaveBeenCalled();
    });

    expect(
      screen.getByText(/we could not send the magic link\. double-check the email and try again\./i),
    ).toBeInTheDocument();
  });

  it('verifies a pin and sanitizes the value before submitting', async () => {
    verifyPinMock.mockResolvedValue({ message: 'All clear', success: true });

    const user = userEvent.setup();
    render(<AuthPage />);

    const magicEmailInput = screen.getAllByLabelText(/email address/i)[0];
    await user.type(magicEmailInput, 'judge@example.com');

    const pinInput = screen.getByLabelText(/access pin/i);
    await user.type(pinInput, '12-34ab56');

    await user.click(screen.getByRole('button', { name: /verify pin/i }));

    await waitFor(() => {
      expect(verifyPinMock).toHaveBeenCalledWith({ email: 'judge@example.com', pin: '123456' });
    });

    expect(screen.getByText(/all clear/i)).toBeVisible();
  });
});
