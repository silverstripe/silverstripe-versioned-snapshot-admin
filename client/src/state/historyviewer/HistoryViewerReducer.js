import { defaultCompare } from 'types/compareType';
import { VERSION_MODE_VERSION, VERSION_MODE_DATE } from 'components/HistoryViewer/HistoryViewer';
import HISTORY_VIEWER from './HistoryViewerActionTypes';

const initialState = {
  currentPage: 1,
  previewMode: false, // False for not displayed by default
  currentVersion: false,
  compare: defaultCompare,
  loading: false,
  messages: [],
};

/**
 * Reducer for the `versionedAdmin.historyViewer` state key.
 *
 * @param {object} state
 * @param {string} type - Name of the dispatched action.
 * @param {object} payload - Optional data passed with the action.
 */
export default function historyViewerReducer(state = initialState, { type, payload } = {}) {
  switch (type) {
    case HISTORY_VIEWER.SET_CURRENT_PAGE: {
      return {
        ...state,
        currentPage: payload.page,
      };
    }

    case HISTORY_VIEWER.SHOW_VERSION: {
      const { version } = payload;
      return {
        ...state,
        previewMode: version && VERSION_MODE_VERSION,
        currentVersion: version,
      };
    }

    case HISTORY_VIEWER.SHOW_DATE: {
      const { version } = payload;
      return {
        ...state,
        previewMode: version && VERSION_MODE_DATE,
        currentVersion: version,
      };
    }

    case HISTORY_VIEWER.SHOW_LIST: {
      return {
        ...state,
        currentVersion: false,
        currentDate: false,
        previewMode: false,
        currentPage: 0,
      };
    }

    case HISTORY_VIEWER.ADD_MESSAGE: {
      return {
        ...state,
        messages: [
          payload,
          ...state.messages,
        ],
      };
    }

    case HISTORY_VIEWER.CLEAR_MESSAGES: {
      return {
        ...state,
        messages: [],
      };
    }

    case HISTORY_VIEWER.SET_COMPARE_MODE: {
      const initialCompare = {
        versionFrom: false,
        versionTo: false,
        ...state.compare
      };

      return {
        ...state,
        compare: payload.enabled ? initialCompare : false,
        previewMode: payload.enabled ? state.previewMode : false,
      };
    }

    case HISTORY_VIEWER.SET_COMPARE_FROM: {
      let { compare: { versionFrom, versionTo } } = state;
      versionFrom = payload.version || false;

      if (!versionFrom) {
        versionFrom = versionTo;
        versionTo = false;
      }

      return {
        ...state,
        currentVersion: versionFrom,
        compare: { versionFrom, versionTo },
      };
    }

    case HISTORY_VIEWER.SET_COMPARE_TO: {
      let { compare: { versionFrom, versionTo } } = state;
      versionTo = payload.version || false;

      // A normal `diff` always shows what it takes turn FROM into TO
      // Here, comparisons are always FROM oldest TO newest version
      // Version IDs (versionObject.version) are always positive & in creation order.
      if (versionTo && versionFrom && versionTo.version < versionFrom.version) {
        versionFrom = versionTo;
        versionTo = state.compare.versionFrom;
      }

      return {
        ...state,
        currentVersion: versionFrom,
        compare: { versionFrom, versionTo },
      };
    }

    default:
      return state;
  }
}
