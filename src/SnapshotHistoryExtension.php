<?php

namespace SilverStripe\SnapshotAdmin;

use DNADesign\Elemental\Models\BaseElement;
use SilverStripe\CMS\Model\SiteTree;
use SilverStripe\Core\Extension;
use SilverStripe\Forms\FieldList;
use SilverStripe\Snapshots\SnapshotPublishable;
use SilverStripe\Versioned\Versioned;

/**
 * @extends Extension<BaseElement>
 * @extends Extension<SnapshotHistoryExtension>
 */
class SnapshotHistoryExtension extends Extension
{
    public function isSnapshotable(): bool
    {
        $owner = $this->getOwner();

        return
            $owner->hasExtension(Versioned::class) &&
            $owner->hasExtension(SnapshotPublishable::class) &&
            !$owner instanceof SiteTree;
    }

    protected function updateCMSFields(FieldList $fields): void
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
