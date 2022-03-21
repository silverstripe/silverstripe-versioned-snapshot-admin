<?php

namespace SilverStripe\SnapshotAdmin;

use Exception;
use SilverStripe\ORM\DataExtension;
use SilverStripe\ORM\DataList;
use SilverStripe\ORM\DataQuery;

class SnapshotPublishableExtension extends DataExtension
{
    /**
     * We want to get the version that the snapshots should point to
     * @throws Exception
     */
    public function updateRelevantSnapshots(DataList &$result)
    {
        $result = $result
            ->applyRelation('Items.Version', $itemVersionColumn)
            ->alterDataQuery(static function (DataQuery $query) use ($itemVersionColumn) {
                $query->selectField($itemVersionColumn, 'baseVersion');
            });
    }
}
