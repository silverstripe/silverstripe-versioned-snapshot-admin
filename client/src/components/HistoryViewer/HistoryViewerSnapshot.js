import React, { Component } from 'react';
import { inject } from 'lib/Injector';
import i18n from 'i18n';
import { compose } from 'redux';
import { connect } from 'react-redux';
import {
  showVersion,
  clearMessages
} from 'state/historyviewer/HistoryViewerActions';
import classNames from 'classnames';


class HistoryViewerSnapshot extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  getClassNames() {
    const { extraClass, isActive } = this.props;
    const defaultClasses = {
      'history-viewer__row': true,
      'history-viewer__snapshot': true,
      'history-viewer__row--current': isActive,
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
          <span className="history-viewer__version-no" role="cell" />
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

function mapDispatchToProps(dispatch) {
  return {
    onSelect(selectedVersion) {
      dispatch(showVersion(selectedVersion));
      dispatch(clearMessages());
    }
  };
}

export default compose(
  connect(null, mapDispatchToProps),
  inject(
    ['FormAction', 'HistoryViewerSnapshotState'],
    (FormAction, HistoryViewerSnapshotState) => ({
        FormActionComponent: FormAction,
        StateComponent: HistoryViewerSnapshotState,
      })
  )
)(HistoryViewerSnapshot);
