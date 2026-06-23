/* global jest, describe, it, expect */

import React from 'react';
import { render } from '@testing-library/react';
import { Component as HistoryViewerVersionList } from '../HistoryViewerVersionList';

describe('HistoryViewerVersionList', () => {
  const FormAlertComponent = () => <div />;
  const HeadingComponent = () => <li />;
  const VersionComponent = () => <div />;

  describe('render()', () => {
    // Verifies the list renders as a <ul> carrying the history-viewer table class
    it('returns an unordered list', () => {
      const { container } = render(<HistoryViewerVersionList
        FormAlertComponent={FormAlertComponent}
        HeadingComponent={HeadingComponent}
        VersionComponent={VersionComponent}
        versions={[]}
      />);

      const list = container.querySelectorAll('ul');

      expect(list[0].className).toContain('history-viewer__table');
    });
  });
});
