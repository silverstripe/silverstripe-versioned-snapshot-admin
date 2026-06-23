/* global jest, describe, it, expect */

import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import { Component as HistoryViewer } from '../HistoryViewer';

describe('HistoryViewer', () => {
  const ListComponent = () => <table />;
  const VersionDetailComponent = () => <div />;
  const CompareWarningComponent = () => <div />;

  // Mock select functions to replace the ones provided by mapDispatchToProps
  let mockOnSelect;
  let mockOnSetPage;

  beforeEach(() => {
    mockOnSelect = jest.fn();
    mockOnSetPage = jest.fn();
  });

  // SnapshotViewerContainer pre-shapes the REST response into this legacy `snapshotHistory.edges`
  // structure that getVersions() reads. Two versions (14, 13), with 13 as the latest draft.
  const versions = {
    snapshotHistory: {
      pageInfo: {
        totalCount: 2
      },
      edges: [
        {
          node: {
            baseVersion: 14,
            author: {
              firstName: 'Michelle',
              surname: 'Masters'
            },
            publisher: null,
            published: false,
            latestDraftVersion: false,
            liveVersion: false,
            lastEdited: '2018-03-08 11:57:58',
            isFullVersion: false,
          }
        },
        {
          node: {
            baseVersion: 13,
            author: {
              firstName: 'Scott',
              surname: 'Stockman'
            },
            publisher: null,
            published: false,
            latestDraftVersion: true,
            liveVersion: false,
            lastEdited: '2018-03-08 11:57:56',
            isFullVersion: false,
          }
        },
      ],
    },
  };

  describe('getVersions()', () => {
    // Verifies getVersions() flattens the snapshotHistory edges into version objects
    it('returns the node element from each version edge', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewer
        ListComponent={ListComponent}
        VersionDetailComponent={VersionDetailComponent}
        CompareWarningComponent={CompareWarningComponent}
        versions={versions}
        recordId={1}
        recordClass="MockType"
        limit={100}
        compare={false}
      />);

      expect(component.getVersions().map((version) => version.version)).toEqual([14, 13]);
    });
  });

  describe('getLatestVersion()', () => {
    // Verifies getLatestVersion() picks the list item flagged latestDraftVersion when none is selected
    it('returns the version marked as latestDraftVersion', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewer
        ListComponent={ListComponent}
        VersionDetailComponent={VersionDetailComponent}
        CompareWarningComponent={CompareWarningComponent}
        versions={versions}
        recordId={1}
        recordClass="MockType"
        limit={100}
        page={1}
        compare={false}
      />);

      expect(component.getLatestVersion().version).toEqual(13);
    });

    // Verifies getLatestVersion() prefers a selected currentVersion (flagged latest draft) over the list
    it('gives priority to the currentVersion', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewer
        ListComponent={ListComponent}
        VersionDetailComponent={VersionDetailComponent}
        CompareWarningComponent={CompareWarningComponent}
        versions={versions}
        recordId={1}
        recordClass="MockType"
        limit={100}
        page={1}
        compare={false}
        currentVersion={{
          version: 123,
          latestDraftVersion: true
        }}
      />);

      expect(component.getLatestVersion().version).toEqual(123);
    });
  });

  describe('render()', () => {
    // Verifies render() shows the loading spinner while the `loading` prop is set
    it('shows a loading state while loading results', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewer
        ListComponent={ListComponent}
        VersionDetailComponent={VersionDetailComponent}
        CompareWarningComponent={CompareWarningComponent}
        versions={versions}
        recordId={1}
        recordClass="MockType"
        limit={100}
        loading
      />);

      const result = ReactTestUtils
        .scryRenderedDOMComponentsWithTag(component, 'cms-content-loading-spinner');

      expect(result).toBeTruthy();
    });
  });

  describe('handleSetPage()', () => {
    // Verifies handleSetPage() forwards the requested page number to onSetPage
    it('dispatches onSetPage with the requested page number', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewer
        ListComponent={ListComponent}
        VersionDetailComponent={VersionDetailComponent}
        CompareWarningComponent={CompareWarningComponent}
        recordId={1}
        recordClass="MockType"
        onSelect={mockOnSelect}
        onSetPage={mockOnSetPage}
        limit={1}
        page={2}
        versions={versions}
        compare={false}
      />);
      component.handleSetPage(1);
      expect(mockOnSetPage).toBeCalledWith(1);
    });
  });

  describe('onSelect()', () => {
    // Verifies componentWillUnmount() calls onSelect(0) to clear the selected version
    it('called when components unmounts', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewer
        ListComponent={ListComponent}
        VersionDetailComponent={VersionDetailComponent}
        CompareWarningComponent={CompareWarningComponent}
        recordId={1}
        recordClass="MockType"
        onSelect={mockOnSelect}
        onSetPage={mockOnSetPage}
        limit={1}
        page={2}
        versions={versions}
        compare={false}
      />);

      component.componentWillUnmount();
      expect(mockOnSelect).toBeCalled();
    });
  });

  describe('isListView()', () => {
    // Verifies isListView() is true when no version is selected and compare is off
    it('returns true when no current version or compare mode is set', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewer
        ListComponent={ListComponent}
        VersionDetailComponent={VersionDetailComponent}
        CompareWarningComponent={CompareWarningComponent}
        recordId={1}
        recordClass="MockType"
        onSelect={mockOnSelect}
        onSetPage={mockOnSetPage}
        limit={1}
        page={2}
        versions={versions}
        currentVersion={false}
        compare={false}
      />);

      expect(component.isListView()).toBe(true);
    });

    // Verifies isListView() is false when a version is selected and compare is off (detail view)
    it('returns false current version is set and compare mode is not', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewer
        ListComponent={ListComponent}
        VersionDetailComponent={VersionDetailComponent}
        CompareWarningComponent={CompareWarningComponent}
        recordId={1}
        recordClass="MockType"
        onSelect={mockOnSelect}
        onSetPage={mockOnSetPage}
        limit={1}
        page={2}
        versions={versions}
        currentVersion={{
          ID: 1,
        }}
        compare={false}
      />);

      expect(component.isListView()).toBe(false);
    });

    // Verifies isListView() is true when only the compare "from" side is set
    it('returns true when current version is set with only compare FROM', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewer
        ListComponent={ListComponent}
        VersionDetailComponent={VersionDetailComponent}
        CompareWarningComponent={CompareWarningComponent}
        recordId={1}
        recordClass="MockType"
        onSelect={mockOnSelect}
        onSetPage={mockOnSetPage}
        limit={1}
        page={2}
        versions={versions}
        currentVersion={{
          ID: 1,
        }}
        compare={{
          versionFrom: {
            ID: 1,
          },
        }}
      />);

      expect(component.isListView()).toBe(true);
    });

    // Verifies isListView() is false when both compare sides are set (comparison detail view)
    it('returns false when in compare mode', () => {
      // `loading` renders the early loading branch so we don't mount the detail view (which
      // pulls in the real ResizeAware); isListView() is a pure read of compare/currentVersion.
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewer
        ListComponent={ListComponent}
        VersionDetailComponent={VersionDetailComponent}
        CompareWarningComponent={CompareWarningComponent}
        recordId={1}
        recordClass="MockType"
        onSelect={mockOnSelect}
        onSetPage={mockOnSetPage}
        limit={1}
        page={2}
        versions={versions}
        loading
        currentVersion={{
          ID: 1
        }}
        compare={{
          versionFrom: {
            ID: 1,
          },
          versionTo: {
            ID: 2,
          },
        }}
      />);

      expect(component.isListView()).toBe(false);
    });
  });

  describe('compareModeAvailable()', () => {
    // Verifies compareModeAvailable() is true when more than one version exists
    it('returns true when more than one version is present', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewer
        ListComponent={ListComponent}
        VersionDetailComponent={VersionDetailComponent}
        CompareWarningComponent={CompareWarningComponent}
        recordId={1}
        recordClass="MockType"
        onSelect={mockOnSelect}
        onSetPage={mockOnSetPage}
        limit={1}
        page={2}
        versions={versions}
      />);

      expect(component.compareModeAvailable()).toBe(true);
    });

    // Verifies compareModeAvailable() is false when fewer than two versions are parseable
    it('returns false with only one version', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewer
        ListComponent={ListComponent}
        VersionDetailComponent={VersionDetailComponent}
        CompareWarningComponent={CompareWarningComponent}
        recordId={1}
        recordClass="MockType"
        onSelect={mockOnSelect}
        onSetPage={mockOnSetPage}
        limit={1}
        page={2}
        versions={{
          Versions: {
            pageInfo: { totalCount: 1 },
            edges: [
              { node: { Version: 14 } },
            ],
          }
        }}
      />);

      expect(component.compareModeAvailable()).toBe(false);
    });
  });
});
