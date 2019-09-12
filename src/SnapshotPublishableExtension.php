<?php

namespace SilverStripe\SnapshotAdmin;

use SilverStripe\ORM\DataExtension;
use SilverStripe\ORM\DataList;
use SilverStripe\ORM\DataObject;
use SilverStripe\ORM\DataQuery;
use SilverStripe\ORM\DB;
use SilverStripe\Snapshots\Snapshot;
use SilverStripe\Snapshots\SnapshotHasher;
use SilverStripe\Snapshots\SnapshotItem;

class SnapshotPublishableExtension extends DataExtension
{
    use SnapshotHasher;

    /**
     * We want to get the version that the snapshots should point to
     */
    public function updateRelevantSnapshots(DataList &$result)
    {
        $snapshotTable = DataObject::getSchema()->tableName(Snapshot::class);
        $itemTable = DataObject::getSchema()->tableName(SnapshotItem::class);
        $hash = static::hashObjectForSnapshot($this->owner);
        $result = $result->alterDataQuery(function (DataQuery $query) use ($hash, $snapshotTable, $itemTable) {
            $subquery = <<<SQL
                (
                  SELECT "Version" FROM "$itemTable" 
                  WHERE "ObjectHash" = ? AND "$itemTable"."SnapshotID" = "$snapshotTable"."ID"
                )
SQL;
            $query->selectField(
                DB::inline_parameters($subquery, [$hash]),
                'BaseVersion'
            );
            return $query;
        });
    }
}
