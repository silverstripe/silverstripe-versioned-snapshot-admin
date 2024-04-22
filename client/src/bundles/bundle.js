/* eslint-disable
 import/no-webpack-loader-syntax,
 import/no-extraneous-dependencies,
 import/no-unresolved
 */

// Expose fields (see webpack config for matching "externals" config)
import 'expose-loader?exposes=SnapshotsViewer!components/HistoryViewer/HistoryViewer';
import 'expose-loader?exposes=versionType!types/versionType';

// Legacy CMS
import '../legacy/ArchiveAdmin/ArchiveAdmin';

// Legacy form fields
// Fields used by core legacy UIs, or available to users
// To do: determine better way of using webpack to pull in optional javascript
import '../legacy/HistoryViewer/HistoryViewerEntwine';

// Legacy publish/unpublish popup confirmation - copy from versioned-admin
import '../legacy/VersionedEditForm/VersionedEditForm';

import 'boot';
