<?php


namespace SilverStripe\SnapshotAdmin;

use SilverStripe\CMS\Model\SiteTree;
use SilverStripe\Control\Director;
use SilverStripe\Core\Config\Config;
use SilverStripe\Forms\FieldList;
use SilverStripe\ORM\DataExtension;
use SilverStripe\Snapshots\SnapshotPublishable;
use SilverStripe\Versioned\Versioned;

class SnapshotHistoryExtension extends DataExtension
{
    /**
     * @return bool
     */
    public function isSnapshotable(): bool
    {
        return (
            $this->owner->hasExtension(Versioned::class) &&
            $this->owner->hasExtension(SnapshotPublishable::class) &&
            !$this->owner instanceof SiteTree
        );
    }

    /**
     * @param FieldList $fields
     * @return void|null
     */
    public function updateCMSFields(FieldList $fields)
    {
        if ($fields->findTab('Root.History')) {
            return null;
        }
        if (!$this->owner->isSnapshotable()) {
            return null;
        }

        $fields->addFieldToTab('Root.History', SnapshotViewerField::create(
            'SnapshotHistory'
        ));
    }
}
