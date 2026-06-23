/* global jest, describe, it, expect */

import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import { Component as HistoryViewerToolbar } from '../HistoryViewerToolbar';

describe('HistoryViewerToolbar', () => {
  const FormActionComponent = () => <div />;
  const ViewModeComponent = () => <div />;
  // RollbackMutation is a render-prop component; hand its children the rollback function
  let mockRollback;
  let RollbackMutation;
  let revertHandler;

  beforeEach(() => {
    mockRollback = jest.fn(() => Promise.resolve());
    RollbackMutation = ({ children }) => children(mockRollback);
    revertHandler = jest.fn();
  });

  describe('handleRevert()', () => {
    // Verifies handleRevert() calls the rollback mutation with the record/version, then onAfterRevert
    it('runs the rollback mutation then onAfterRevert on success', () => {
      const component = ReactTestUtils.renderIntoDocument(<HistoryViewerToolbar
        onAfterRevert={revertHandler}
        RollbackMutation={RollbackMutation}
        FormActionComponent={FormActionComponent}
        ViewModeComponent={ViewModeComponent}
        recordId={123}
        recordClass="MockClass"
        versionId={234}
        typeName="MockType"
      />);

      return component.handleRevert(mockRollback, 123, 'MockClass', 234)
        .then(() => {
          expect(mockRollback).toHaveBeenCalledWith({
            variables: { id: 123, dataClass: 'MockClass', toVersion: 234 },
          });
          expect(revertHandler).toHaveBeenCalledWith(234);
        });
    });
  });
});
