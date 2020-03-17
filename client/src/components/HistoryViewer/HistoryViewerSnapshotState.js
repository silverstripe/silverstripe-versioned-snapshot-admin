import { Component as VersionedState } from './HistoryViewerVersionState';
import { inject } from 'lib/Injector';

class HistoryViewerSnapshotState extends VersionedState {
  translateType(type) {
    const { i18n } = window;
    switch (type) {
      case 'MODIFIED':
        return i18n._t('HistoryViewerSnapshot.MODIFIED', 'Edited');
      case 'DELETED':
        return i18n._t('HistoryViewerSnapshot.DELETED', 'Archived');
      case 'CREATED':
        return i18n._t('HistoryViewerSnapshot.CREATED', 'Created');
      case 'ADDED':
        return i18n._t('HistoryViewerSnapshot.ADDED', 'Added');
      case 'REMOVED':
        return i18n._t('HistoryViewerSnapshot.REMOVED', 'Removed');
      case 'UNPUBLISHED':
        return i18n._t('HistoryViewerSnapshot.UNPUBLISHED', 'Unpublished');
      case 'PUBLISHED':
        return i18n._t('HistoryViewerSnapshot.PUBLISHED', 'Published');
      default:
        return '';
    }
  }

  getPublishedState() {
    const { ActivityDescription, ActivityType } = this.props.version;

    const prefix = this.translateType(ActivityType);
    const lines = ActivityDescription.split('\n');
    if (lines.length > 1) {
      return lines.map((l, i) => <div key={i}>{l}</div>);
    }
    return `${prefix} ${ActivityDescription}`;
  }

  getBadges() {
    // No LIVE badge unless it's a native version
    return null;
  }
}

export { HistoryViewerSnapshotState as Component };

export default inject(
  ['Badge'],
  (BadgeComponent) => ({ BadgeComponent }),
)(HistoryViewerSnapshotState);
