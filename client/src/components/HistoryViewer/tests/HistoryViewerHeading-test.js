/* global jest, describe, it, expect */

import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import { Component as HistoryViewerHeading } from '../HistoryViewerHeading';

describe('HistoryViewerHeading', () => {
  // Mock select functions to replace the ones provided by mapDispatchToProps
  const mockOnCompareModeSelect = jest.fn();
  const mockOnCompareModeUnselect = jest.fn();

  describe('handleCompareModeChange()', () => {
    // Verifies handleCompareModeChange() calls onCompareModeUnselect when compare mode is on
    it('notifies the store to leave compare mode when it is currently selected', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerHeading
        compareModeSelected
        onCompareModeSelect={mockOnCompareModeSelect}
        onCompareModeUnselect={mockOnCompareModeUnselect}
      />);

      component.handleCompareModeChange();
      expect(mockOnCompareModeUnselect).toHaveBeenCalled();
    });

    // Verifies handleCompareModeChange() calls onCompareModeSelect when compare mode is off
    it('notifies the store to enter compare mode when it is not currently selected', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerHeading
        compareModeSelected={false}
        onCompareModeSelect={mockOnCompareModeSelect}
        onCompareModeUnselect={mockOnCompareModeUnselect}
      />);

      component.handleCompareModeChange();
      expect(mockOnCompareModeSelect).toHaveBeenCalled();
    });
  });
});
