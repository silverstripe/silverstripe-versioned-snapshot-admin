/* eslint-disable import/no-unresolved */

import Injector from 'lib/Injector';
import HistoryViewer from 'components/HistoryViewer/HistoryViewer';
import SnapshotViewerContainer from 'components/HistoryViewer/SnapshotViewerContainer';
import HistoryViewerHeading from 'components/HistoryViewer/HistoryViewerHeading';
import HistoryViewerToolbar from 'components/HistoryViewer/HistoryViewerToolbar';
import HistoryViewerVersion from 'components/HistoryViewer/HistoryViewerVersion';
import HistoryViewerVersionDetail from 'components/HistoryViewer/HistoryViewerVersionDetail';
import HistoryViewerVersionList from 'components/HistoryViewer/HistoryViewerVersionList';
import HistoryViewerVersionState from 'components/HistoryViewer/HistoryViewerVersionState';
import HistoryViewerSnapshotState from 'components/HistoryViewer/HistoryViewerSnapshotState';
import HistoryViewerSnapshot from 'components/HistoryViewer/HistoryViewerSnapshot';
import HistoryViewerCompareWarning from 'components/HistoryViewer/HistoryViewerCompareWarning';
import RollbackMutation from 'components/HistoryViewer/RollbackMutation';

/**
 * The reason we have not gone down the route of using the same name for components
 * is that we were running into race conditions with the injector. For example we
 * had the HistoryViewer component having two graphql HoCs applied to it. The last one
 * applied would "win" and update it's state
 *
 * We've opted to go down the route of renaming references rather than names in the hopes that
 * in the future when the injector is able to support removing registered HoC's
 */
export default () => {
  Injector.component.register('SnapshotViewer', HistoryViewer);
  Injector.component.register('SnapshotViewerContainer', SnapshotViewerContainer);
  Injector.component.register('SnapshotHistoryViewer', HistoryViewer);
  Injector.component.register('SnapshotRollbackMutation', RollbackMutation);
  Injector.component.registerMany({
    SnapshotHistoryViewerHeading: HistoryViewerHeading,
    SnapshotHistoryViewerToolbar: HistoryViewerToolbar,
    SnapshotHistoryViewerVersion: HistoryViewerVersion,
    SnapshotHistoryViewerVersionDetail: HistoryViewerVersionDetail,
    SnapshotHistoryViewerVersionList: HistoryViewerVersionList,
    SnapshotHistoryViewerVersionState: HistoryViewerVersionState,
    SnapshotHistoryViewerSnapshotState: HistoryViewerSnapshotState,
    SnapshotHistoryViewerSnapshot: HistoryViewerSnapshot,
    SnapshotHistoryViewerCompareWarning: HistoryViewerCompareWarning,
  }, { force: true });
};
