/* global window */

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import Griddle from 'griddle-react';
import historyViewerConfig from 'containers/HistoryViewer/HistoryViewerConfig';
import i18n from 'i18n';
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
import ResizeAware from 'react-resize-aware';
import * as viewModeActions from 'state/viewMode/ViewModeActions';
import PropTypes from 'prop-types';

const VERSION_MODE_VERSION = 'VERSION';
const VERSION_MODE_DATE = 'DATE';

export {
  VERSION_MODE_VERSION,
  VERSION_MODE_DATE,
};

/**
 * The HistoryViewer component is abstract, and requires an Injector component
 * to be connected providing the GraphQL query implementation for the appropriate
 * DataObject type
 */
class HistoryViewer extends Component {
  constructor(props) {
    super(props);

    this.handleSetPage = this.handleSetPage.bind(this);
    this.handleNextPage = this.handleNextPage.bind(this);
    this.handlePrevPage = this.handlePrevPage.bind(this);
  }

  /**
   * Manually handle state changes in the page number, because Griddle doesn't support Redux.
   * See: https://github.com/GriddleGriddle/Griddle/issues/626
   *
   * @param {object} prevProps
   */
  componentDidUpdate(prevProps) {
    const { page: prevPage } = prevProps;
    const { page: currentPage, actions: { versions } } = this.props;

    if (prevPage !== currentPage && typeof versions.goToPage === 'function') {
      versions.goToPage(currentPage);
    }
  }

  /**
   * Reset the selected version when unmounting HistoryViewer to prevent data leaking
   * between instances
   */
  componentWillUnmount() {
    const { onSelect } = this.props;
    if (typeof onSelect === 'function') {
      onSelect(false);
    }
  }

  /**
   * Returns the result of the GraphQL version history query
   *
   * @returns {Array}
   */
  getVersions() {
    const { versions } = this.props;
    const edges = (versions && versions.SnapshotHistory && versions.SnapshotHistory.edges)
      ? versions.SnapshotHistory.edges
      : [];
    return edges.map(({ node }) => {
      return {
        ...node,
        ...node.OriginVersion,
        AbsoluteLink: node.IsFullVersion
          ? (node.OriginVersion && node.OriginVersion.AbsoluteLink)
          : versions.AbsoluteLink,
        Version: node.IsFullVersion
          ? (node.OriginVersion && node.OriginVersion.Version)
          : node.BaseVersion,
      }
    });
  }

  /**
   * Returns a string to be used as the "class" attribute on the history viewer container
   *
   * @returns {string}
   */
  getContainerClasses() {
    const { compare, isInGridField } = this.props;

    // GridFieldDetailForm provides its own padding, so apply a class to counteract this.
    return classNames('history-viewer', 'fill-height', {
      'history-viewer__compare-mode': compare,
      'history-viewer--no-margins': isInGridField && !this.isListView(),
    });
  }

  /**
   * Get the latest version from the list available (if there is one)
   *
   * @returns {object|null}
   */
  getLatestVersion() {
    const { currentVersion } = this.props;

    // Check whether the "current version" (in the store) is the latest draft
    if (currentVersion && currentVersion.LatestDraftVersion === true) {
      return currentVersion;
    }

    // Look for one in the list of available versions
    const latestDraftVersion = this.getVersions()
      .filter(version => version.LatestDraftVersion === true);

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
   * Compare mode is not available when only one version exists
   *
   * @returns {boolean}
   */
  compareModeAvailable() {
    return this.getVersions().length > 1;
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
      recordId,
      recordClass,
      typeName,
      schemaUrl,
      // previewMode,
      VersionDetailComponent,
      compare,
      compare: { versionFrom = false, versionTo = false },
      previewState,
    } = this.props;
    // Insert variables into the schema URL via regex replacements
    const schemaVersionReplacements = {
      ':id': recordId,
      ':class': recordClass,
      ':date': '',
      ':version': '',
    };

    // Currently previewMode === MODE_VERSION is disabled as it displays incorrect relations.

    schemaVersionReplacements[':date'] = currentVersion.LastEdited;

    const schemaCompareReplacements = {
      ':id': recordId,
      ':class': recordClass,
      ':from': versionFrom.Version || 0,
      ':to': versionTo.Version || 0,
    };
    const schemaSearch = compare ? /:id|:class|:from|:to/g : /:id|:class|:version|:date/g;
    const schemaReplacements = compare ? schemaCompareReplacements : schemaVersionReplacements;

    const version = compare ? versionFrom : currentVersion;
    const latestVersion = this.getLatestVersion();
    const props = {
      // comparison shows two versions as one, so by nature cannot be a single 'latest' version.
      isLatestVersion: !compare && latestVersion && latestVersion.Version === version.Version,
      isPreviewable,
      recordId,
      typeName,
      schemaUrl: schemaUrl.replace(schemaSearch, (match) => schemaReplacements[match]),
      version,
      compare,
      compareModeAvailable: this.compareModeAvailable(),
      previewState,
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
   * See: ThumbnailView.js
   *
   * @returns {XML|null}
   */
  renderPagination() {
    const { limit, page, versions } = this.props;

    if (!versions) {
      return null;
    }

    const totalVersions = versions.SnapshotHistory
      ? versions.SnapshotHistory.pageInfo.totalCount
      : 0;

    if (totalVersions <= limit) {
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

    return (
      <div className="griddle-footer">
        <Griddle.GridPagination {...props} />
      </div>
    );
  }

  /**
   * Render the list containing versions selected for comparison.
   * It is not the ListComponent's place to know the context in which it is being rendered
   * so it is the directive of this contextual component to tell it what stylistic adaptations
   * it should present based on the context (the type of list it contains).
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
    } = this.props;

    return (
      <div className={this.getContainerClasses()}>
        <CompareWarningComponent />

        <div className={isInGridField ? '' : 'panel panel--padded panel--scrollable'}>
          {this.renderComparisonSelectionList()}
          <ListComponent
            versions={this.getVersions()}
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
    const { loading, compare, previewMode } = this.props;

    if (loading) {
      return <Loading />;
    }

    if (this.compareModeAvailable() && compare) {
      return this.renderCompareMode();
    }

    if (previewMode) {
      return this.renderVersionDetail();
    }

    return this.renderVersionList();
  }
}

HistoryViewer.propTypes = {
  contextKey: PropTypes.string,
  limit: PropTypes.number,
  ListComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  offset: PropTypes.number,
  recordId: PropTypes.number.isRequired,
  recordClass: PropTypes.string.isRequired,
  typeName: PropTypes.string.isRequired,
  currentVersion: PropTypes.oneOfType([PropTypes.bool, versionType]),
  compare: compareType,
  isInGridField: PropTypes.bool,
  isPreviewable: PropTypes.bool,
  VersionDetailComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  CompareWarningComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  versions: PropTypes.shape({
    Versions: PropTypes.shape({
      pageInfo: PropTypes.shape({
        totalCount: PropTypes.number,
      }),
      edges: PropTypes.arrayOf(PropTypes.shape({
        node: versionType,
      })),
    }),
  }),
  page: PropTypes.number,
  schemaUrl: PropTypes.string,
  // @todo replace this with import { VIEW_MODE_STATES } from 'state/viewMode/ViewModeStates'
  // when webpack-config has this export available via silverstripe/admin
  previewState: PropTypes.oneOf(['edit', 'preview', 'split']),
  actions: PropTypes.object,
  onSelect: PropTypes.func,
  onSetPage: PropTypes.func,
  onResize: PropTypes.func,
};

HistoryViewer.defaultProps = {
  compare: {},
  contextKey: '',
  currentVersion: false,
  isInGridField: false,
  isPreviewable: false,
  typeName: '',
  schemaUrl: '',
  versions: {
    Versions: {
      pageInfo: {
        totalCount: 0,
      },
      edges: [],
    },
  },
};


function mapStateToProps(state) {
  const {
    currentPage,
    currentVersion,
    previewMode,
    compare,
  } = state.versionedAdmin.historyViewer;

  const { activeState } = state.viewMode;

  return {
    page: currentPage,
    currentVersion,
    compare,
    previewMode,
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
    }
  };
}

export { HistoryViewer as Component };

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  historyViewerConfig,
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
