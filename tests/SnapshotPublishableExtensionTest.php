<?php

namespace SilverStripe\SnapshotAdmin\Tests;

use Page;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\ORM\DataObject;
use SilverStripe\ORM\ValidationException;
use SilverStripe\Snapshots\Snapshot;
use SilverStripe\Snapshots\SnapshotEvent;
use SilverStripe\Snapshots\SnapshotItem;
use SilverStripe\Snapshots\SnapshotPublishable;

class SnapshotTest extends SapphireTest
{
    /**
     * @var bool
     */
    protected $usesDatabase = true;

    /**
     * @var array
     */
    protected static $extra_dataobjects = [
        SnapshotItem::class,
        Snapshot::class,
        SnapshotEvent::class,
        Page::class,
    ];

    /**
     * @throws ValidationException
     */
    public function testUpdateRelevantSnapshots(): void
    {
        /** @var Page|SnapshotPublishable $a1 */
        $a1 = Page::create();
        $a1->Title = 'A1 Block Page';
        $this->snapshot($a1);

        $snapshots = $a1->getRelevantSnapshots();
        $versions = $snapshots->column('baseVersion');
        $versions = array_unique($versions);
        $this->assertSame([(int) $a1->Version], $versions);
    }

    /**
     * @param DataObject $obj
     * @param array $extraObjects
     * @return Snapshot
     * @throws ValidationException
     */
    private function snapshot(DataObject $obj, array $extraObjects = []): Snapshot
    {
        $obj->write();
        $obj = DataObject::get_by_id($obj->ClassName, $obj->ID, false);
        $snapshot = Snapshot::singleton()->createSnapshot($obj, $extraObjects);
        $snapshot->write();

        return $snapshot;
    }
}
