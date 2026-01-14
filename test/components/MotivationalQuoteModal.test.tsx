import { describe, it, expect, vi } from 'vitest';
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

  it('should have correct animation classes', () => {
    const { container } = render(<MotivationalQuoteModal {...defaultProps} />);

    // Find the outermost div with animation classes
    const modal = container.querySelector('.fixed.bottom-4.right-4');
    expect(modal).toBeTruthy();
    expect(modal?.className).toContain('animate-springInRight');
    expect(modal?.className).toContain('animate-colorCycle');
  });

  it('should have correct styling', () => {
    const { container } = render(<MotivationalQuoteModal {...defaultProps} />);

    // Find the outermost div with inline style
    const modal = container.querySelector('.fixed.bottom-4.right-4');
    expect(modal).toBeTruthy();
    expect(modal?.getAttribute('style')).toContain('max-width: 340px');
  });
});
