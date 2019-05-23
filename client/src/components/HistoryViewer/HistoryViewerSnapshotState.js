import { Component as VersionedState } from './HistoryViewerVersionState';
import { inject } from 'lib/Injector';

class HistoryViewerSnapshotState extends VersionedState {
  getPublishedState() {
    return this.props.version.ActivityDescription;
  }
}

export { HistoryViewerSnapshotState as Component };

export default inject(
  ['Badge'],
  (BadgeComponent) => ({ BadgeComponent }),
)(HistoryViewerSnapshotState);
