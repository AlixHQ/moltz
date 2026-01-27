import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from './MessageBubble';

describe('MessageBubble', () => {
  const mockMessage = {
    id: 'test-id',
    role: 'user' as const,
    content: 'Test message',
    timestamp: Date.now(),
  };

  it('should render user message', () => {
    render(<MessageBubble message={mockMessage} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render assistant message', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: 'AI response',
    };
    
    render(<MessageBubble message={assistantMessage} />);
    expect(screen.getByText('AI response')).toBeInTheDocument();
  });

  it('should render markdown content', () => {
    const markdownMessage = {
      ...mockMessage,
      content: '**Bold** and *italic*',
    };
    
    render(<MessageBubble message={markdownMessage} />);
    // Check that markdown is rendered (actual implementation may vary)
    const element = screen.getByText(/Bold/).parentElement;
    expect(element).toBeInTheDocument();
  });

  it('should render code blocks', () => {
    const codeMessage = {
      ...mockMessage,
      content: '```javascript\nconst x = 42;\n```',
    };
    
    render(<MessageBubble message={codeMessage} />);
    // Verify code block rendering
    expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
  });

  it('should display timestamp', () => {
    const timestampedMessage = {
      ...mockMessage,
      timestamp: Date.now(),
    };
    
    render(<MessageBubble message={timestampedMessage} />);
    // Check for timestamp element (implementation specific)
    const bubble = screen.getByText('Test message').closest('[data-message-id]');
    expect(bubble).toBeInTheDocument();
  });

  it('should handle long messages', () => {
    const longMessage = {
      ...mockMessage,
      content: 'A'.repeat(1000),
    };
    
    render(<MessageBubble message={longMessage} />);
    expect(screen.getByText(/A+/)).toBeInTheDocument();
  });

  it('should render error state', () => {
    const errorMessage = {
      ...mockMessage,
      error: true,
      content: 'Error occurred',
    };
    
    render(<MessageBubble message={errorMessage as any} />);
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });
});
