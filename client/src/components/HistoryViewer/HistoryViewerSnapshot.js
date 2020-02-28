import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { inject } from 'lib/Injector';
import i18n from 'i18n';
import { compose } from 'redux';
import { connect } from 'react-redux';
import {
  showVersion,
  showDate,
  clearMessages
} from 'state/historyviewer/HistoryViewerActions';
import classNames from 'classnames';
import { versionType } from 'types/versionType';
import getDateFromVersion from '../../helpers/getDateFromVersion';

class HistoryViewerSnapshot extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  getClassNames() {
    const { extraClass, isActive, initial } = this.props;
    const defaultClasses = {
      'history-viewer__row': true,
      'history-viewer__snapshot': true,
      'history-viewer__row--current': isActive,
      'history-viewer__snapshot--initial': initial,
    };
    return classNames(defaultClasses, extraClass);
  }

  handleClick() {
    const { onSelect, version, isActive } = this.props;

    // If the clear button is shown, don't do anything when clicking on the row
    if (isActive) {
      return false;
    }
    onSelect(version);
    return false;
  }

  handleClose(e) {
    e.stopPropagation();
    this.props.onSelect(false);
    return false;
  }

  handleKeyUp(event) {
    if (event.keyCode === 13) {
      this.handleClick();
    }
  }

  render() {
    const { version, StateComponent, FormActionComponent } = this.props;
    const { Author: { FirstName, Surname } } = version;
    const author = `${FirstName || ''} ${Surname || ''}`;
    const rowTitle = i18n._t('HistoryViewerSnapshot.GO_TO_SNAPSHOT', 'Go to snapshot at {date}');

    return (
      <li className={this.getClassNames()} role="row">
        <span
          className="history-viewer__version-link"
          role="button"
          title={i18n.inject(rowTitle, { date: version.LastEdited })}
          onClick={this.handleClick}
          onKeyUp={this.handleKeyUp}
          tabIndex={0}
        >
          <span className="history-viewer__message" role="cell">
            <span>{version.ActivityAgo}</span>
            {' '}
            <small className="text-muted">{getDateFromVersion(version)}</small>
          </span>

          <StateComponent
            version={version}
          />
          <span className="history-viewer__author" role="cell">
            {author}
          </span>
          <span className="history-viewer__actions" role="cell">
            <FormActionComponent
              onClick={this.handleClose}
              icon="cancel"
              // Provide the title as an attribute to prevent it
              // from rendering as text on the button
              attributes={{
                title: i18n._t('HistoryViewerVersion.CLOSE', 'Close'),
              }}
              title={null}
              buttonStyle="outline-light"
              extraClass="history-viewer__close-button"
            />
          </span>
        </span>
      </li>
    );
  }
}

HistoryViewerSnapshot.propTypes = {
  isActive: PropTypes.bool,
  version: versionType,
  initial: PropTypes.bool,
};

function mapDispatchToProps(dispatch) {
  return {
    onSelect(selectedVersion) {
      const func = selectedVersion.IsFullVersion ? showVersion : showDate;
      dispatch(func(selectedVersion));
      dispatch(clearMessages());
    }
  };
}

export default compose(
  connect(null, mapDispatchToProps),
  inject(
    ['FormAction', 'SnapshotHistoryViewerSnapshotState'],
    (FormAction, HistoryViewerSnapshotState) => ({
        FormActionComponent: FormAction,
        StateComponent: HistoryViewerSnapshotState,
      })
  )
)(HistoryViewerSnapshot);
