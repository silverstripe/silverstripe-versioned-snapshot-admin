/* global jest, describe, it, expect */

import React from 'react';
import { render } from '@testing-library/react';
import { Component as HistoryViewerHeading } from '../HistoryViewerHeading';

describe('HistoryViewerHeading', () => {
  // Mock select functions to replace the ones provided by mapDispatchToProps
  const mockOnCompareModeSelect = jest.fn();
  const mockOnCompareModeUnselect = jest.fn();

  describe('handleCompareModeChange()', () => {
    // Verifies handleCompareModeChange() calls onCompareModeUnselect when compare mode is on
    it('notifies the store to leave compare mode when it is currently selected', () => {
      const ref = React.createRef();
      render(<HistoryViewerHeading
        ref={ref}
        compareModeSelected
        onCompareModeSelect={mockOnCompareModeSelect}
        onCompareModeUnselect={mockOnCompareModeUnselect}
      />);

      ref.current.handleCompareModeChange();
      expect(mockOnCompareModeUnselect).toHaveBeenCalled();
    });

    // Verifies handleCompareModeChange() calls onCompareModeSelect when compare mode is off
    it('notifies the store to enter compare mode when it is not currently selected', () => {
      const ref = React.createRef();
      render(<HistoryViewerHeading
        ref={ref}
        compareModeSelected={false}
        onCompareModeSelect={mockOnCompareModeSelect}
        onCompareModeUnselect={mockOnCompareModeUnselect}
      />);

      ref.current.handleCompareModeChange();
      expect(mockOnCompareModeSelect).toHaveBeenCalled();
    });
  });
});
