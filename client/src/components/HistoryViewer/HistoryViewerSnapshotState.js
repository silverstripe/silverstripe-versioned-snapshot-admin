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
    const description = ActivityDescription.charAt(0).toLowerCase()
      + ActivityDescription.substring(1);

    return `${prefix} ${description}`;
  }
}

export { HistoryViewerSnapshotState as Component };

export default inject(
  ['Badge'],
  (BadgeComponent) => ({ BadgeComponent }),
)(HistoryViewerSnapshotState);
