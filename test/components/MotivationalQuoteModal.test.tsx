import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MotivationalQuoteModal from '../../app/components/MotivationalQuoteModal.tsx';

describe('MotivationalQuoteModal Component', () => {
  const defaultProps = {
    quote: '天道酬勤，厚德载物',
    source: '老子',
    onClose: vi.fn()
  };

  it('should render quote and source', () => {
    const { container } = render(<MotivationalQuoteModal {...defaultProps} />);

    // Check that the text content contains both quote and source
    expect(container.textContent).toContain('天道酬勤，厚德载物');
    expect(container.textContent).toContain('老子');
  });

  it('should call onClose when clicked', () => {
    const { container } = render(<MotivationalQuoteModal {...defaultProps} />);

    // Find the outermost div with the onClick handler (has the animation classes)
    const modal = container.querySelector('.fixed.bottom-4.right-4');
    expect(modal).toBeTruthy();

    if (modal) {
      fireEvent.click(modal);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should have animation class', () => {
    const { container } = render(<MotivationalQuoteModal {...defaultProps} />);

    // Find the outermost div
    const modal = container.querySelector('.fixed.bottom-4.right-4');
    expect(modal).toBeTruthy();
    // Should have the CSS-driven color cycling class
    expect(modal?.className).toContain('animate-colorCycle');
  });

  it('should have correct styling', () => {
    const { container } = render(<MotivationalQuoteModal {...defaultProps} />);

    // Find the outermost div with inline style
    const modal = container.querySelector('.fixed.bottom-4.right-4');
    expect(modal).toBeTruthy();
    expect(modal?.getAttribute('style')).toContain('max-width: 340px');
  });

  it('should auto fade out after 5 seconds', () => {
    vi.useFakeTimers();
    
    render(<MotivationalQuoteModal {...defaultProps} />);
    
    // Fast-forward 5 seconds + 500ms fade animation
    vi.advanceTimersByTime(5500);
    
    // onClose should have been called after fade out (allowing for multiple calls due to re-renders)
    expect(defaultProps.onClose).toHaveBeenCalled();
    
    vi.useRealTimers();
  });
});
