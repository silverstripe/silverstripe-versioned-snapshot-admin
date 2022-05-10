<?php

namespace SilverStripe\SnapshotAdmin;

use Exception;
use SilverStripe\ORM\DataExtension;
use SilverStripe\ORM\DataList;
use SilverStripe\ORM\DataQuery;
use SilverStripe\Snapshots\SnapshotPublishable;

/**
 * Enhance
 */
class SnapshotPublishableExtension extends DataExtension
{
    /**
     * We want to get the version that the snapshots should point to
     * Extension point in @see SnapshotPublishable::getRelevantSnapshots()
     *
     * @throws Exception
     */
    public function updateRelevantSnapshots(DataList &$result): void
    {
        $itemVersionColumn = null;
        $result = $result
            ->applyRelation('Items.ObjectVersion', $itemVersionColumn)
            ->alterDataQuery(static function (DataQuery $query) use ($itemVersionColumn) {
                $query->selectField($itemVersionColumn, 'baseVersion');
            });
    }
}
