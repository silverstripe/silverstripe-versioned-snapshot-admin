/* global window */

import React, { Component } from 'react';
import { compose, bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Paginator from 'components/Paginator/Paginator';
import { inject } from 'lib/Injector';
import Loading from 'components/Loading/Loading';
import {
  setCurrentPage,
  showVersion,
  clearMessages,
} from 'state/historyviewer/HistoryViewerActions';
import { versionType } from 'types/versionType';
import { compareType } from 'types/compareType';
import classNames from 'classnames';
import ResizeAware from 'components/ResizeAware/ResizeAware';
import * as viewModeActions from 'state/viewMode/ViewModeActions';
import * as toastsActions from 'state/toasts/ToastsActions';
import PropTypes from 'prop-types';
import i18n from 'i18n';

/**
 * The HistoryViewer component is abstract, and requires an Injector component
 * to be connected providing the query implementation for the appropriate
 * DataObject type
 */
class HistoryViewer extends Component {
  constructor(props) {
    super(props);

    this.handleSetPage = this.handleSetPage.bind(this);
    this.handleNextPage = this.handleNextPage.bind(this);
    this.handlePrevPage = this.handlePrevPage.bind(this);
    this.handleAfterRevert = this.handleAfterRevert.bind(this);
  }

  componentDidMount() {
    // Data fetching is now handled by the parent container
    // Display a toast if there were any pre-existing graphql errors
    const { graphQLErrors, toastActions } = this.props;
    if (graphQLErrors.length > 0) {
      toastActions.error(i18n._t('Admin.UNKNOWN_ERROR', 'An unknown error has occurred.'));
    }
  }

  componentDidUpdate(prevProps) {
    // Display a toast if there were any new graphql errors
    if (prevProps.graphQLErrors.length < this.props.graphQLErrors.length) {
      this.props.toastActions.error(i18n._t('Admin.UNKNOWN_ERROR', 'An unknown error has occurred.'));
    }

    // Data fetching on page change is now handled by the parent container's useEffect
  }

  /**
   * Reset the selected version when unmounting HistoryViewer to prevent data leaking
   * between instances
   */
  componentWillUnmount() {
    const { onSelect } = this.props;
    if (typeof onSelect === 'function') {
      onSelect(0);
    }
  }

  /**
   * Data fetching (refreshVersionData) has been removed.
   * It is now handled by the parent SnapshotViewerContainer.
   */

  /**
   * Returns a string to be used as the "class" attribute on the history viewer container
   *
   * @returns {string}
   */
  getContainerClasses() {
    const { compare, isInGridField } = this.props;

    // GridFieldDetailForm provides its own padding, so apply a class to counteract this.
    return classNames(
      'history-viewer',
      'fill-height',
      'panel--scrollable',
      {
        'history-viewer__compare-mode': compare,
        'history-viewer--no-margins': isInGridField && !this.isListView(),
      }
    );
  }

  /**
   * Get the latest version from the list available (if there is one)
   *
   * @returns {object|null}
   */
  getLatestVersion() {
    const { currentVersion, versions } = this.props;

    // Check whether the "current version" (in the store) is the latest draft
    if (currentVersion && currentVersion.latestDraftVersion === true) {
      return currentVersion;
    }

    // Look for one in the list of available versions (from props)
    const latestDraftVersion = versions
      .filter(version => version.latestDraftVersion === true);

    if (latestDraftVersion.length) {
      return latestDraftVersion[0];
    }

    return null;
  }

  /**
   * List view is when either no current version is set, or only one of the two versions is
   * set for compare mode
   *
   * @returns {boolean}
   */
  isListView() {
    const { compare, currentVersion } = this.props;

    // Nothing is set: initial list view
    if (!currentVersion) {
      return true;
    }

    // No compare mode data set: it's detail view
    if (!compare) {
      return false;
    }

    // Only part of the compare mode data is set: it's list view
    if (compare.versionFrom && !compare.versionTo) {
      return true;
    }

    return false;
  }

  /**
   * Handles setting the pagination page number
   *
   * @param {number} page
   */
  handleSetPage(page) {
    const { onSetPage } = this.props;
    if (typeof onSetPage === 'function') {
      // Note: data from Griddle is zero-indexed
      onSetPage(page + 1);
    }
  }

  /**
   * Handler for incrementing the set page
   */
  handleNextPage() {
    const { page } = this.props;
    // Note: data for Griddle needs to be zero-indexed, so don't add 1 to this
    this.handleSetPage(page);
  }

  /**
   * Handler for decrementing the set page
   */
  handlePrevPage() {
    const { page } = this.props;
    // Note: data for Griddle needs to be zero-indexed
    const currentPage = page - 1;
    if (currentPage < 1) {
      this.handleSetPage(currentPage);
      return;
    }
    this.handleSetPage(currentPage - 1);
  }

  /**
   * Handler for after reverting
   */
  handleAfterRevert() {
    const { onAfterRevert } = this.props;
    if (window.location.href.indexOf('/admin/pages/history/show/') !== -1) {
      // if we're editing page history, call the refresh trigger from the container
      if (onAfterRevert) {
        onAfterRevert();
      }
    } else {
      // if we're editing a datobject, then we need to reload the entire edit form so that
      // we're showing the correct version of the object (the one we just reverted to) in the edit form
      // set a timeout so that the user can see the success message before the page reloads
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  /**
   * Compare mode is not available when only one version exists
   *
   * @returns {boolean}
   */
  compareModeAvailable() {
    return this.props.versions.length > 1;
  }

  /**
   * Renders the detail form for a selected version
   *
   * @returns {HistoryViewerVersionDetail}
   */
  renderVersionDetail() {
    const {
      currentVersion,
      isPreviewable,
      isRevertable,
      recordId,
      recordClass,
      schemaUrl,
      VersionDetailComponent,
      compare,
      compare: { versionFrom = false, versionTo = false },
      previewState,
      onAfterRevert, // Get onAfterRevert from props
    } = this.props;
    // Insert variables into the schema URL via regex replacements
    const schemaVersionReplacements = {
      ':id': recordId,
      ':class': recordClass,
      ':date': currentVersion.lastEdited,
      ':version': currentVersion.version,
    };

    const schemaCompareReplacements = {
      ':id': recordId,
      ':class': recordClass,
      ':from': versionFrom.version || 0,
      ':to': versionTo.version || 0,
    };

    const schemaSearch = compare ? /:id|:class|:from|:to/g : /:id|:class|:version|:date/g;
    const schemaReplacements = compare ? schemaCompareReplacements : schemaVersionReplacements;

    const version = compare ? versionFrom : currentVersion;
    const latestVersion = this.getLatestVersion();

    const props = {
      // comparison shows two versions as one, so by nature cannot be a single 'latest' version.
      isLatestVersion: !compare && latestVersion && latestVersion.version === version.version,
      isPreviewable,
      isRevertable,
      recordId,
      recordClass,
      schemaUrl: schemaUrl.replace(schemaSearch, (match) => schemaReplacements[match]),
      version,
      compare,
      compareModeAvailable: this.compareModeAvailable(),
      previewState,
      // Use the new handleAfterRevert method that calls the prop
      onAfterRevert: this.handleAfterRevert,
    };

    return (
      <ResizeAware
        className={this.getContainerClasses()}
        onResize={({ width }) => this.props.onResize(width)}
      >
        <VersionDetailComponent {...props} />
      </ResizeAware>
    );
  }

  /**
   * Renders the react component for pagination.
   * Currently borrows the pagination from Griddle, to keep styling consistent
   * between the two views.
   *
   * @returns {XML|null}
   */
  renderPagination() {
    const { limit, page, pageInfo } = this.props;
    const totalVersions = pageInfo.totalCount;

    if (!totalVersions || totalVersions <= limit) {
      return null;
    }

    const props = {
      setPage: this.handleSetPage,
      maxPage: Math.ceil(totalVersions / limit),
      next: this.handleNextPage,
      nextText: i18n._t('HistoryViewer.NEXT', 'Next'),
      previous: this.handlePrevPage,
      previousText: i18n._t('HistoryViewer.PREVIOUS', 'Previous'),
      // Note: zero indexed
      currentPage: page - 1,
      useGriddleStyles: false,
    };

    return <Paginator {...props} />;

    // Griddle Pagination replaced with <Paginator>
    // return (
    // <div className="griddle-footer">
    //      <Griddle.GridPagination {...props} />
    //   </div>
    // );
  }

  /**
   * Render the list containing versions selected for comparison.
   *
   * @returns {HistoryViewerVersionList|null}
   */
  renderComparisonSelectionList() {
    const { compare: { versionFrom }, ListComponent } = this.props;

    if (!versionFrom) {
      return null;
    }

    const selectionListClasses = classNames(
      'history-viewer__table',
      'history-viewer__table--comparison-selected',
    );

    return (
      <ListComponent
        versions={[versionFrom]}
        extraClass={selectionListClasses}
      />
    );
  }

  /**
   * Renders a list of versions
   *
   * @returns {HistoryViewerVersionList}
   */
  renderVersionList() {
    const {
      isInGridField,
      ListComponent,
      CompareWarningComponent,
      compare,
      compare: { versionFrom: hasVersionFrom },
      versions, // Get versions from props
    } = this.props;

    return (
      <div className={this.getContainerClasses()}>
        <CompareWarningComponent />

        <div className={isInGridField ? '' : 'panel panel--padded panel--scrollable'}>
          {this.renderComparisonSelectionList()}
          <ListComponent
            versions={versions} // Pass versions from props
            showHeader={!compare || (compare && !hasVersionFrom)}
            compareModeAvailable={this.compareModeAvailable()}
          />

          <div className="history-viewer__pagination">
            {this.renderPagination()}
          </div>
        </div>
      </div>
    );
  }

  renderCompareMode() {
    const { compare } = this.props;

    if (compare && compare.versionFrom && compare.versionTo) {
      return this.renderVersionDetail();
    }
    return this.renderVersionList();
  }

  render() {
    const { graphQLErrors, loading, compare, currentVersion, recordId } = this.props;

    // A toast message will be shown in componentDidMount() or componentDidUpdate()
    if (graphQLErrors && graphQLErrors.length > 0) {
      return null;
    }

    if (!recordId) {
      return null;
    }

    if (loading) {
      return <Loading />;
    }

    if (this.compareModeAvailable() && compare) {
      return this.renderCompareMode();
    }

    if (currentVersion) {
      return this.renderVersionDetail();
    }

    return this.renderVersionList();
  }
}

HistoryViewer.propTypes = {
  loading: PropTypes.bool,
  graphQLErrors: PropTypes.arrayOf(PropTypes.string),
  versions: PropTypes.array, // Added versions from container
  pageInfo: PropTypes.shape({ // Added pageInfo from container
    totalCount: PropTypes.number,
  }),
  contextKey: PropTypes.string,
  limit: PropTypes.number,
  ListComponent: PropTypes.elementType.isRequired,
  offset: PropTypes.number,
  recordId: PropTypes.number,
  recordClass: PropTypes.string,
  currentVersion: PropTypes.oneOfType([PropTypes.bool, versionType]),
  compare: compareType,
  isInGridField: PropTypes.bool,
  isPreviewable: PropTypes.bool,
  isRevertable: PropTypes.bool,
  VersionDetailComponent: PropTypes.elementType.isRequired,
  CompareWarningComponent: PropTypes.elementType.isRequired,
  page: PropTypes.number,
  schemaUrl: PropTypes.string,
  previewState: PropTypes.oneOf(['edit', 'preview', 'split']),
  actions: PropTypes.object,
  onSelect: PropTypes.func,
  onSetPage: PropTypes.func,
  onResize: PropTypes.func,
  onAfterRevert: PropTypes.func, // Added from container
  toastActions: PropTypes.shape({
    display: PropTypes.func,
    info: PropTypes.func,
    success: PropTypes.func,
    warning: PropTypes.func,
    error: PropTypes.func,
  }),
};

HistoryViewer.defaultProps = {
  loading: false,
  graphQLErrors: [],
  versions: [], // Add default
  pageInfo: { totalCount: 0 }, // Add default
  compare: {},
  contextKey: '',
  currentVersion: false,
  isInGridField: false,
  isPreviewable: false,
  isRevertable: false,
  schemaUrl: '',
};

function mapStateToProps(state) {
  const {
    currentPage,
    currentVersion,
    compare,
  } = state.versionedAdmin.historyViewer;

  const { activeState } = state.viewMode;

  return {
    page: currentPage,
    currentVersion,
    compare,
    previewState: activeState,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelect(id) {
      dispatch(showVersion(id));
      dispatch(clearMessages());
    },
    onSetPage(page) {
      dispatch(setCurrentPage(page));
    },
    onResize(panelWidth) {
      dispatch(viewModeActions.enableOrDisableSplitMode(panelWidth));
    },
    toastActions: bindActionCreators(toastsActions, dispatch),
  };
}

export { HistoryViewer as Component };

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  // historyViewerConfig has been removed as it provides the GraphQL query which is no longer used.
  inject(
    ['SnapshotHistoryViewerVersionList', 'SnapshotHistoryViewerVersionDetail', 'SnapshotHistoryViewerCompareWarning'],
    (ListComponent, VersionDetailComponent, CompareWarningComponent) => ({
      ListComponent,
      VersionDetailComponent,
      CompareWarningComponent,
    }),
    ({ contextKey }) => `VersionedAdmin.HistoryViewer.${contextKey}`
  )
)(HistoryViewer);
