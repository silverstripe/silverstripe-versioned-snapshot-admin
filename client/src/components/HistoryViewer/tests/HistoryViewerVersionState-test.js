/* global jest, describe, it, expect */

import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import { Component as HistoryViewerVersionState } from '../HistoryViewerVersionState';

describe('HistoryViewerVersionState', () => {
  let component = null;
  HistoryViewerVersionState.defaultProps.BadgeComponent = () => <div />;

  describe('getClassNames()', () => {
    // Verifies getClassNames() appends extraClass to the default state class
    it('adds extra classes to the default class', () => {
      component = ReactTestUtils
        .renderIntoDocument(<HistoryViewerVersionState extraClass="foobar" />);

      expect(component.getClassNames()).toContain('foobar');
      expect(component.getClassNames()).toContain('history-viewer__version-state');
    });
  });

  describe('getPublishedState', () => {
    // Verifies getPublishedState() returns "Published" for a PUBLISHED activity type
    it('returns the correct state', () => {
      const mockVersion = {
        activityType: 'PUBLISHED'
      };

      component = ReactTestUtils
        .renderIntoDocument(<HistoryViewerVersionState version={mockVersion} />);

      expect(component.getPublishedState()).toBe('Published');
    });

    // Verifies getPublishedState() falls back to "Saved" when no activity type is set
    it('defaults to "Saved" if not defined', () => {
      component = ReactTestUtils
        .renderIntoDocument(<HistoryViewerVersionState version={{}} />);

      expect(component.getPublishedState()).toBe('Saved');
    });
  });

  describe('getBadges', () => {
    // Verifies getBadges() returns a "Live" success badge for a live snapshot
    it('returns a Badge when the version is live', () => {
      const mockVersion = {
        isLiveSnapshot: true
      };
      component = ReactTestUtils
        .renderIntoDocument(<HistoryViewerVersionState version={mockVersion} />);

      const badge = component.getBadges();
      expect(badge.props.message).toEqual('Live');
      expect(badge.props.status).toEqual('success');
    });

    // Verifies getBadges() returns an empty string when the version is not live
    it('returns an empty string when version is not live', () => {
      component = ReactTestUtils
        .renderIntoDocument(<HistoryViewerVersionState />);

      expect(component.getBadges()).toBe('');
    });
  });
});
