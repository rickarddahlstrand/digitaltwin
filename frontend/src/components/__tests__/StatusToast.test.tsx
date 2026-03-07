import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import StatusToast from '../StatusToast';

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('StatusToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows message when provided', () => {
    render(<StatusToast message="Kartan är redo" />);
    expect(screen.getByText('Kartan är redo')).toBeInTheDocument();
  });

  it('does not show anything for empty message', () => {
    const { container } = render(<StatusToast message="" />);
    expect(container.textContent).toBe('');
  });

  it('hides message after duration', () => {
    render(<StatusToast message="Test" duration={2000} />);
    expect(screen.getByText('Test')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2001);
    });
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('defaults to 3000ms duration', () => {
    render(<StatusToast message="Default" />);
    expect(screen.getByText('Default')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(screen.getByText('Default')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(screen.queryByText('Default')).not.toBeInTheDocument();
  });
});
