<?php

namespace SilverStripe\SnapshotAdmin;

use SilverStripe\Admin\LeftAndMain;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\HTTPResponse_Exception;
use SilverStripe\ORM\DataObject;
use SilverStripe\Snapshots\SnapshotPublishable;

/**
 * Temporary shim to provide rollback capability
 */
class SnapshotAdmin extends LeftAndMain
{
    private static string $url_segment = 'snapshot';

    private static string $url_rule = '/$Action';

    private static int $url_priority = 10;

    private static string $required_permission_codes = 'CMS_ACCESS_CMSMain';

    private static bool $ignore_menuitem = true;

    private static array $url_handlers = [
        'rollback/$RecordClass!/$RecordID!/$Snapshot!' => 'handleRollback',
    ];

    private static array $allowed_actions = [
        'handleRollback',
    ];

    /**
     * @param HTTPRequest $request
     * @return mixed
     * @throws HTTPResponse_Exception
     */
    public function handleRollback(HTTPRequest $request): mixed
    {
        $class = $request->param('RecordClass');
        $id = $request->param('RecordID');
        $snapshot = urldecode($request->param('Snapshot'));
        $class = str_replace('__', '\\', $class);

        /** @var SnapshotPublishable $record */
        $record = DataObject::get_by_id($class, $id);

        if (!$record) {
            $this->httpError(404);
        }

        // TODO this method is missing
        $record->doRollbackToSnapshot($snapshot);

        return $this->redirectBack();
    }
}
