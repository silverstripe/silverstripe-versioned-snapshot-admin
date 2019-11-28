import Injector from 'lib/Injector';
import HistoryViewer from 'components/HistoryViewer/HistoryViewer';
import HistoryViewerHeading from 'components/HistoryViewer/HistoryViewerHeading';
import HistoryViewerToolbar from 'components/HistoryViewer/HistoryViewerToolbar';
import HistoryViewerVersion from 'components/HistoryViewer/HistoryViewerVersion';
import HistoryViewerVersionDetail from 'components/HistoryViewer/HistoryViewerVersionDetail';
import HistoryViewerVersionList from 'components/HistoryViewer/HistoryViewerVersionList';
import HistoryViewerVersionState from 'components/HistoryViewer/HistoryViewerVersionState';
import HistoryViewerSnapshotState from 'components/HistoryViewer/HistoryViewerSnapshotState';
import HistoryViewerSnapshot from 'components/HistoryViewer/HistoryViewerSnapshot';
import HistoryViewerCompareWarning from 'components/HistoryViewer/HistoryViewerCompareWarning';
import snapshotQuery from 'graphql/snapshotsQuery';
import pageRevertMutation from '../state/historyviewer/pageRevertMutation';

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
  Injector.component.register('SnapshotHistoryViewer', HistoryViewer);
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
  });
  Injector.transform(
    'snapshot-history',
    (updater) => {
      // Add CMS page history GraphQL query to the HistoryViewer
      updater.component('SnapshotViewer.pages-controller-cms-content', snapshotQuery);
      updater.component(
        'SnapshotHistoryViewerToolbar.VersionedAdmin.HistoryViewer.SiteTree.HistoryViewerVersionDetail',
        // Copied from CMS, because transforms can only be applied to explicit keys ("HistoryViewerToolbar")
        // Rather than a named service.
        pageRevertMutation,
        'PageRevertMutation'
      );

    }
  );
};

