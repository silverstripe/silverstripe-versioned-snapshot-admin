import React, { Component } from 'react';
import classnames from 'classnames';
import i18n from 'i18n';
import { versionType, defaultVersion } from 'types/versionType';
import { inject } from 'lib/Injector';
import PropTypes from 'prop-types';

class HistoryViewerVersionState extends Component {
  /**
   * Get the HTML classes to apply to the state
   *
   * @returns {string}
   */
  getClassNames() {
    const { extraClass } = this.props;
    return classnames('history-viewer__version-state', extraClass);
  }

  /**
   * When the record is published, return "Published", else return "Saved"
   *
   * @returns {string}
   */
  getPublishedState() {
    const { version } = this.props;

    if (version.Published) {
      return i18n._t('HistoryViewer.Published', 'Published');
    }
    return i18n._t('HistoryViewer.Saved', 'Saved');
  }


  /**
   * Return any status badges for the record
   *
   * @returns {ReactElement|string}
   */
  getBadges() {
    const { version, isActive, BadgeComponent } = this.props;

    if (version.LiveVersion) {
      return (
        <BadgeComponent
          status="success"
          message={i18n._t('HistoryViewer.BadgeLive', 'Live')}
          className="" // removes the default pill styles
          inverted={isActive}
        />
      );
    }

    return '';
  }

  render() {
    return (
      <span className={this.getClassNames()} role="cell">
        {this.getPublishedState()} {' '}
        {this.getBadges()}
      </span>
    );
  }
}

HistoryViewerVersionState.propTypes = {
  version: versionType,
  extraClass: PropTypes.string,
  isActive: PropTypes.bool,
  BadgeComponent: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func,
  ]).isRequired
};

HistoryViewerVersionState.defaultProps = {
  version: defaultVersion,
  extraClass: '',
  isActive: false,
};

export { HistoryViewerVersionState as Component };

export default inject(
  ['Badge'],
  (BadgeComponent) => ({ BadgeComponent }),
  ({ version }) => `HistoryViewer.HistoryViewerVersionState.${version.Version}`
)(HistoryViewerVersionState);
