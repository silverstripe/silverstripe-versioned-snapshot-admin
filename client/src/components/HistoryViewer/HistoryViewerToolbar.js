import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import i18n from 'i18n';
import { inject } from 'lib/Injector';
import { addMessage, showList } from 'state/historyviewer/HistoryViewerActions';
import { Tooltip } from 'reactstrap';

class HistoryViewerToolbar extends Component {
  constructor(props) {
    super(props);

    this.handleRevert = this.handleRevert.bind(this);
    this.handleToggleRevertTooltip = this.handleToggleRevertTooltip.bind(this);

    this.state = {
      isReverting: false,
      revertTooltipOpen: false,
      tooltipTimer: null,
    };
  }

  /**
   * Triggers a revert action to be performed for the current record's version
   * @param {func} rollback
   * @returns Promise
   */
  handleRevert(rollback) {
    const { onAfterRevert, recordId, versionId } = this.props;

    this.setState({ isReverting: true });

    const handler = typeof onAfterRevert === 'function' ? onAfterRevert : () => {};
    return rollback({ variables: {
      id: recordId,
      toVersion: versionId
    }}).then(() => handler(versionId));
  }

  handleToggleRevertTooltip() {
    this.setState(state => ({
      revertTooltipOpen: !state.revertTooltipOpen,
    }));
  }

  render() {
    const {
      FormActionComponent,
      ViewModeComponent,
      RollbackMutation,
      isLatestVersion,
      isPreviewable,
      canRollback,
      rollbackMessage,
      typeName,
    } = this.props;
    const { isReverting, revertTooltipOpen } = this.state;

    const revertButtonTitle = isReverting
      ? i18n._t('HistoryViewerToolbar.REVERT_IN_PROGRESS', 'Revert in progress...')
      : i18n._t('HistoryViewerToolbar.REVERT_UNAVAILABLE', 'Unavailable for the current version');

    return (
      <RollbackMutation typeName={typeName}>
        {(rollback) => {
          return (
            <div className="toolbar toolbar--south">
              <div className="btn-toolbar">
                <FormActionComponent
                  id="HistoryRevertButton"
                  onClick={() => this.handleRevert(rollback)}
                  icon="back-in-time"
                  name="revert"
                  attributes={{
                    title: revertButtonTitle,
                  }}
                  data={{
                    buttonStyle: 'warning'
                  }}
                  disabled={isLatestVersion || isReverting || !canRollback}
                  loading={isReverting}
                  title={i18n._t('HistoryViewerToolbar.REVERT_TO_VERSION', 'Revert to this version')}
                />
                { !canRollback && (
                  <Tooltip
                    trigger="click hover focus"
                    placement="top"
                    isOpen={revertTooltipOpen}
                    toggle={this.handleToggleRevertTooltip}
                    target="HistoryRevertButton"
                  >
                    {rollbackMessage}
                  </Tooltip>
                )}
                { isPreviewable && <ViewModeComponent id="history-viewer-edit-mode" area="edit" /> }
            </div>
          </div>
          )
        }}
      </RollbackMutation>
    );
  }
}

HistoryViewerToolbar.propTypes = {
  actions: PropTypes.shape({
    revertToVersion: PropTypes.func.isRequired,
  }),
  FormActionComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  ViewModeComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  isLatestVersion: PropTypes.bool,
  isPreviewable: PropTypes.bool,
  onAfterRevert: PropTypes.func,
  recordId: PropTypes.number.isRequired,
  typeName: PropTypes.string.isRequired,
  versionId: PropTypes.number.isRequired,
  canRollback: PropTypes.bool,
  rollbackMessage: PropTypes.string,
};

HistoryViewerToolbar.defaultProps = {
  isLatestVersion: false,
  isPreviewable: false,
  canRollback: true,
};


function mapDispatchToProps(dispatch) {
  return {
    onAfterRevert(versionId) {
      dispatch(addMessage(i18n.sprintf(
          i18n._t('HistoryViewerToolbar.REVERTED_MESSAGE', 'Successfully reverted to version %s'),
          versionId
        )));
      dispatch(showList());
    },
  };
}

export { HistoryViewerToolbar as Component };

export default compose(
  connect(null, mapDispatchToProps),
  inject(
    ['FormAction', 'ViewModeToggle', 'SnapshotRollbackMutation'],
    (FormActionComponent, ViewModeComponent, RollbackMutation) => ({
      FormActionComponent,
      ViewModeComponent,
      RollbackMutation,
    }),
    () => 'VersionedAdmin.HistoryViewer.Toolbar'
  )
)(HistoryViewerToolbar);
