/* global jest, describe, it, expect */

import React from 'react';
import { render } from '@testing-library/react';
import { Component as HistoryViewerVersionState } from '../HistoryViewerVersionState';

describe('HistoryViewerVersionState', () => {
  let component = null;
  HistoryViewerVersionState.defaultProps.BadgeComponent = () => <div />;

  // Render the component and return its instance so the methods under test can be called directly
  const renderState = (props = {}) => {
    const ref = React.createRef();
    render(<HistoryViewerVersionState ref={ref} {...props} />);
    return ref.current;
  };

  describe('getClassNames()', () => {
    // Verifies getClassNames() appends extraClass to the default state class
    it('adds extra classes to the default class', () => {
      component = renderState({ extraClass: 'foobar' });

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

      component = renderState({ version: mockVersion });

      expect(component.getPublishedState()).toBe('Published');
    });

    // Verifies getPublishedState() falls back to "Saved" when no activity type is set
    it('defaults to "Saved" if not defined', () => {
      component = renderState({ version: {} });

      expect(component.getPublishedState()).toBe('Saved');
    });
  });

  describe('getBadges', () => {
    // Verifies getBadges() returns a "Live" success badge for a live snapshot
    it('returns a Badge when the version is live', () => {
      const mockVersion = {
        isLiveSnapshot: true
      };
      component = renderState({ version: mockVersion });

      const badge = component.getBadges();
      expect(badge.props.message).toEqual('Live');
      expect(badge.props.status).toEqual('success');
    });

    // Verifies getBadges() returns an empty string when the version is not live
    it('returns an empty string when version is not live', () => {
      component = renderState();

      expect(component.getBadges()).toBe('');
    });
  });
});
