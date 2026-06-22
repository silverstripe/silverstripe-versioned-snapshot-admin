/* global jest, describe, it, expect */

import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import { Component as HistoryViewerVersion } from '../HistoryViewerVersion';

describe('HistoryViewerVersion', () => {
  const StateComponent = () => <div />;
  // Render the extraClass as a DOM class so it can be queried after rendering
  const FormActionComponent = ({ extraClass }) => <div className={extraClass} />;

  let mockOnCompareMode;
  let mockOnSelect;
  let version = {};

  beforeEach(() => {
    mockOnCompareMode = jest.fn();
    mockOnSelect = jest.fn();

    version = {
      author: {
        firstName: 'John',
        surname: 'Smith',
      },
      published: false,
      publisher: {
        firstName: 'Sarah',
        surname: 'Smith',
      },
      version: 3,
    };
  });

  describe('handleCompare()', () => {
    // Verifies handleCompare() dispatches onCompareMode with the current version
    it('calls onCompareMode to dispatch an action as the result of handleCompare call', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerVersion
        version={version}
        onCompareMode={mockOnCompareMode}
        StateComponent={StateComponent}
        FormActionComponent={FormActionComponent}
      />);

      component.handleCompare();
      expect(mockOnCompareMode).toBeCalledWith(version);
    });
  });

  describe('getAuthor()', () => {
    // Verifies getAuthor() returns the snapshot author's full name
    it('returns the author name when unpublished', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerVersion
        version={version}
        StateComponent={StateComponent}
        FormActionComponent={FormActionComponent}
      />);

      expect(component.getAuthor()).toEqual('John Smith');
    });

    // Verifies getAuthor() still returns the author (not publisher) when the version is published
    it('returns the author name even when published (snapshots track their own author)', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerVersion
        version={{
          ...version,
          published: true
        }}
        StateComponent={StateComponent}
        FormActionComponent={FormActionComponent}
      />);

      expect(component.getAuthor()).toEqual('John Smith');
    });
  });

  describe('handleClick()', () => {
    // Verifies clicking the row does not select the version while it is active (clear button shown)
    it('does nothing on row click when the clear button is shown', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerVersion
        version={version}
        StateComponent={StateComponent}
        FormActionComponent={FormActionComponent}
        onSelect={mockOnSelect}
        isActive
      />);

      const link = ReactTestUtils
        .scryRenderedDOMComponentsWithClass(component, 'history-viewer__version-link')[0];
      ReactTestUtils.Simulate.click(link);

      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    // Verifies handleClick() selects the version (compare off) via onSelect
    it('renders version details when version clicked', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerVersion
        version={version}
        StateComponent={StateComponent}
        FormActionComponent={FormActionComponent}
        onSelect={mockOnSelect}
        isActive={false}
        compare={false}
      />);

      component.handleClick();
      expect(mockOnSelect).toHaveBeenCalledWith(version, false);
    });

    // Verifies handleClick() passes the compare state to onSelect when comparing
    it('renders version details when version clicked in compare mode', () => {
      const compare = {
        versionFrom: { version: 0 },
        versionTo: { version: 0 },
      };

      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerVersion
        version={version}
        StateComponent={StateComponent}
        FormActionComponent={FormActionComponent}
        onSelect={mockOnSelect}
        isActive={false}
        compare={compare}
      />);

      component.handleClick();
      expect(mockOnSelect).toHaveBeenCalledWith(version, compare);
    });

    // Verifies clicking in compare mode selects the version without toggling compare mode
    it('chooses version when version clicked in compare mode', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerVersion
        version={version}
        StateComponent={StateComponent}
        FormActionComponent={FormActionComponent}
        onSelect={mockOnSelect}
        compare={{
          versionFrom: { version: 0 },
          versionTo: { version: 0 },
        }}
      />);

      component.handleClick();
      expect(mockOnSelect).toHaveBeenCalled();
      expect(mockOnCompareMode).not.toHaveBeenCalled();
    });
  });

  describe('render()', () => {
    // Verifies an active row renders the close button
    it('renders the close button in the version details', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerVersion
        version={version}
        StateComponent={StateComponent}
        FormActionComponent={FormActionComponent}
        onSelect={mockOnSelect}
        isActive
      />);

      const buttons = ReactTestUtils
        .scryRenderedDOMComponentsWithClass(component, 'history-viewer__close-button');
      expect(buttons).toHaveLength(1);
    });

    // Verifies an active row renders the compare button
    it('renders the compare button in the version details', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerVersion
        version={version}
        StateComponent={StateComponent}
        FormActionComponent={FormActionComponent}
        onSelect={mockOnSelect}
        isActive
      />);

      const buttons = ReactTestUtils
        .scryRenderedDOMComponentsWithClass(component, 'history-viewer__compare-button');
      expect(buttons).toHaveLength(1);
    });
  });

  describe('handleClose()', () => {
    // Verifies handleClose() returns to the list view via onSelect
    it('return back to list view when closing version via action dispatch', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerVersion
        version={version}
        StateComponent={StateComponent}
        FormActionComponent={FormActionComponent}
        onSelect={mockOnSelect}
        isActive
        compare={false}
      />);

      component.handleClose();
      expect(mockOnSelect).toHaveBeenCalled();
    });

    // Verifies handleClose() in compare mode deselects without toggling compare mode
    it('deselect version when closing version in compare mode', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerVersion
        version={version}
        StateComponent={StateComponent}
        FormActionComponent={FormActionComponent}
        onSelect={mockOnSelect}
        isActive
        compare={{
          versionFrom: { version: 0 },
          versionTo: { version: 0 },
        }}
      />);

      component.handleClose();
      expect(mockOnSelect).toHaveBeenCalled();
      expect(mockOnCompareMode).not.toHaveBeenCalled();
    });
  });
});
