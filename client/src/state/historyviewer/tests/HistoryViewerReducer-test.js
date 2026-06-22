/* global jest, describe, it, expect */

import historyViewerReducer from 'state/historyviewer/HistoryViewerReducer';
import { defaultCompare } from 'types/compareType';

describe('HistoryViewerReducer', () => {
  let state = {};
  beforeEach(() => {
    state = {
      currentPage: 1,
      currentVersion: false,
      compare: defaultCompare,
      loading: false,
      messages: [],
    };
  });

  describe('SET_CURRENT_PAGE', () => {
    // Verifies SET_CURRENT_PAGE stores the dispatched page number
    it('adds the current page to the state', () => {
      const result = historyViewerReducer(state, {
        type: 'HISTORY_VIEWER.SET_CURRENT_PAGE',
        payload: { page: 3 },
      });

      expect(result.currentPage).toBe(3);
    });
  });

  describe('SHOW_VERSION', () => {
    // Verifies SHOW_VERSION stores the selected version as currentVersion
    it('sets the current version ID to the current page', () => {
      const result = historyViewerReducer(state, {
        type: 'HISTORY_VIEWER.SHOW_VERSION',
        payload: {
          version:
            {
              version: 23
            }
        },
      });

      expect(result.currentVersion.version).toBe(23);
    });
  });

  describe('SHOW_LIST', () => {
    // Verifies SHOW_LIST clears the selected version and resets to the first page
    it('resets the page and version', () => {
      // Start on a later page so the assertion proves the reducer actively resets it
      const result = historyViewerReducer({ ...state, currentPage: 3 }, {
        type: 'HISTORY_VIEWER.SHOW_LIST',
      });

      expect(result.currentVersion).toBe(false);
      // Pagination is 1-indexed, so returning to the list resets to the first page (1), not 0
      expect(result.currentPage).toBe(1);
    });
  });

  describe('ADD_MESSAGE', () => {
    // Verifies ADD_MESSAGE prepends a message to the store
    it('pushes a new message into the store', () => {
      const result = historyViewerReducer(state, {
        type: 'HISTORY_VIEWER.ADD_MESSAGE',
        payload: {
          type: 'success',
          message: 'hello',
        },
      });

      expect(result.messages.length).toBe(1);
      expect(result.messages[0].message).toBe('hello');
    });
  });

  describe('CLEAR_MESSAGES', () => {
    // Verifies CLEAR_MESSAGES empties the message list
    it('clears all messages from the store', () => {
      state.messages = [{
        type: 'success',
        message: 'hello world',
      }];

      const result = historyViewerReducer(state, {
        type: 'HISTORY_VIEWER.CLEAR_MESSAGES',
      });

      expect(result.messages.length).toBe(0);
    });
  });

  describe('SET_COMPARE_MODE', () => {
    // Verifies enabling compare mode seeds the default empty from/to selection
    it('sets compare to the default enabled value when enabling compare mode', () => {
      state = {
        ...state,
        compare: false,
      };

      const result = historyViewerReducer(state, {
        type: 'HISTORY_VIEWER.SET_COMPARE_MODE',
        payload: { enabled: true },
      });

      expect(result.compare).toEqual({ versionFrom: false, versionTo: false });
    });

    // Verifies disabling compare mode clears the compare selection
    it('resets the compare from/to versions when not in compare mode', () => {
      state = {
        ...state,
        compare: { versionFrom: 1, versionTo: 2 },
      };

      const result = historyViewerReducer(state, {
        type: 'HISTORY_VIEWER.SET_COMPARE_MODE',
        payload: { enabled: false },
      });

      expect(result.compare).toBe(false);
    });

    // Verifies enabling compare mode keeps an already-chosen versionFrom
    it('leaves the existing value for compareFrom when enabling', () => {
      state = {
        ...state,
        compare: { ...state.compare, versionFrom: 1 },
      };

      const result = historyViewerReducer(state, {
        type: 'HISTORY_VIEWER.SET_COMPARE_MODE',
        payload: { enabled: true },
      });

      expect(result.compare.versionFrom).toBe(1);
      expect(result.compare.versionTo).toBe(false);
    });
  });

  describe('SET_COMPARE_FROM', () => {
    // Verifies SET_COMPARE_FROM stores the chosen version as versionFrom
    it('sets the compareFrom to the version', () => {
      state = {
        ...state,
        compare: { versionFrom: false, versionTo: false },
      };

      const result = historyViewerReducer(state, {
        type: 'HISTORY_VIEWER.SET_COMPARE_FROM',
        payload: {
          version:
            {
              version: 47
            }
        },
      });

      expect(result.compare.versionFrom.version).toBe(47);
    });

    // Verifies a cleared versionFrom falls back to the existing versionTo
    it('uses versionTo for versionFrom when version is zero', () => {
      state = {
        ...state,
        compare: {
          versionFrom: {
            version: 50
          },
          versionTo: {
            version: 80
          }
        },
      };

      const result = historyViewerReducer(state, {
        type: 'HISTORY_VIEWER.SET_COMPARE_FROM',
        payload: {}
      });

      expect(result.compare.versionFrom.version).toBe(80);
      expect(result.compare.versionTo).toBe(false);
    });

    // Verifies SET_COMPARE_FROM also sets currentVersion to the chosen version
    it('sets the currentVersion to the compareFrom version', () => {
      state = {
        ...state,
        compare: {
          versionFrom: {
            version: 50,
          },
        },
      };

      const result = historyViewerReducer(state, {
        type: 'HISTORY_VIEWER.SET_COMPARE_FROM',
        payload: {
          version: { version: 60 },
        },
      });

      expect(result.currentVersion.version).toBe(60);
    });
  });

  describe('SET_COMPARE_TO', () => {
    // Verifies SET_COMPARE_TO stores the chosen version as versionTo
    it('sets the compareTo version', () => {
      const result = historyViewerReducer(state, {
        type: 'HISTORY_VIEWER.SET_COMPARE_TO',
        payload: {
          version: { version: 85 }
        },
      });

      expect(result.compare.versionTo.version).toBe(85);
    });

    // Verifies selecting a "to" older than "from" swaps them so from < to
    it('flips the versions if a lower version "to" is selected', () => {
      state = {
        ...state,
        compare: {
          versionFrom: {
            version: 50
          },
          versionTo: {
            version: 100
          }
        },
      };

      const result = historyViewerReducer(state, {
        type: 'HISTORY_VIEWER.SET_COMPARE_TO',
        payload: {
          version: {
            version: 25
          }
        },
      });

      expect(result.compare.versionFrom.version).toBe(25);
      expect(result.compare.versionTo.version).toBe(50);
    });
  });

  // Verifies SET_COMPARE_FROM sets currentVersion to the chosen version
  it('sets the currentVersion to the compareFrom version', () => {
    state = {
      ...state,
      compare: {
        versionFrom: {
          version: 50,
        },
      },
    };

    const result = historyViewerReducer(state, {
      type: 'HISTORY_VIEWER.SET_COMPARE_FROM',
      payload: {
        version: { version: 60 },
      },
    });

    expect(result.currentVersion.version).toBe(60);
  });
});
