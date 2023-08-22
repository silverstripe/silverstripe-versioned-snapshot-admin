<?php

namespace SilverStripe\SnapshotAdmin;

use DNADesign\Elemental\Models\BaseElement;
use SilverStripe\CMS\Model\SiteTree;
use SilverStripe\Forms\FieldList;
use SilverStripe\ORM\DataExtension;
use SilverStripe\Snapshots\SnapshotPublishable;
use SilverStripe\Versioned\Versioned;

/**
 * @method BaseElement|$this getOwner()
 */
class SnapshotHistoryExtension extends DataExtension
{
    /**
     * @return bool
     */
    public function isSnapshotable(): bool
    {
        $owner = $this->getOwner();

        return
            $owner->hasExtension(Versioned::class) &&
            $owner->hasExtension(SnapshotPublishable::class) &&
            !$owner instanceof SiteTree;
    }

    /**
     * @param FieldList $fields
     * @return void|null
     */
    public function updateCMSFields(FieldList $fields): void
    {
        if ($fields->findTab('Root.History')) {
            return;
        }

        if (!$this->getOwner()->isSnapshotable()) {
            return;
        }

        $fields->addFieldToTab('Root.History', SnapshotViewerField::create('SnapshotHistory'));
    }
}
