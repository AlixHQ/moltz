import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInput from './ChatInput';

describe('ChatInput', () => {
  const mockOnSend = vi.fn();
  
  beforeEach(() => {
    mockOnSend.mockClear();
  });

  it('should render textarea', () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<ChatInput onSend={mockOnSend} disabled={true} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('should call onSend when send button is clicked', async () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Hello world');
    });
  });

  it('should clear input after sending', async () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    expect(textarea.value).toBe('Test message');
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  it('should not send empty messages', () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} />);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.click(sendButton);
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should handle Enter key to send', async () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Test');
    });
  });

  it('should handle Shift+Enter for multiline', () => {
    render(<ChatInput onSend={mockOnSend} disabled={false} />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'Line 1' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });
    
    expect(mockOnSend).not.toHaveBeenCalled();
  });
});
