<?php

namespace SilverStripe\SnapshotAdmin;

use SilverStripe\Admin\LeftAndMain;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\HTTPResponse_Exception;
use SilverStripe\ORM\DataObject;
use SilverStripe\Snapshots\SnapshotPublishable;
use SilverStripe\Snapshots\SnapshotVersioned;

/**
 * Temporary shim to provide rollback POC
 *
 * @package SilverStripe\Snapshots
 */
class SnapshotAdmin extends LeftAndMain
{
    /**
     * @var string
     */
    private static $url_segment = 'snapshot';

    /**
     * @var string
     */
    private static $url_rule = '/$Action';

    /**
     * @var int
     */
    private static $url_priority = 10;

    /**
     * @var string
     */
    private static $required_permission_codes = 'CMS_ACCESS_CMSMain';

    /**
     * @var bool
     */
    private static $ignore_menuitem = true;

    /**
     * @var array
     */
    private static $url_handlers = [
        'rollback/$RecordClass!/$RecordID!/$Snapshot!' => 'handleRollback',
    ];

    /**
     * @var array
     */
    private static $allowed_actions = [
        'handleRollback',
    ];

    /**
     * @param HTTPRequest $request
     * @return mixed
     * @throws HTTPResponse_Exception
     */
    public function handleRollback(HTTPRequest $request)
    {
        $class = $request->param('RecordClass');
        $id = $request->param('RecordID');
        $snapshot = urldecode($request->param('Snapshot'));
        $class = str_replace('__', '\\', $class);

        /** @var SnapshotPublishable|SnapshotVersioned $record */
        $record = DataObject::get_by_id($class, $id);

        if (!$record) {
            $this->httpError(404);
        }

        $record->doRollbackToSnapshot($snapshot);

        return $this->redirectBack();
    }
}
