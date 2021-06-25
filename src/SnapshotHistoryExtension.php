<?php


namespace SilverStripe\SnapshotAdmin;

use SilverStripe\CMS\Model\SiteTree;
use SilverStripe\Core\ClassInfo;
use SilverStripe\Forms\FieldList;
use SilverStripe\GraphQL\Schema\Interfaces\SchemaUpdater;
use SilverStripe\GraphQL\Schema\Schema;
use SilverStripe\ORM\DataExtension;
use SilverStripe\ORM\DataObject;
use SilverStripe\Snapshots\SnapshotPublishable;
use SilverStripe\Versioned\Versioned;

class SnapshotHistoryExtension extends DataExtension implements SchemaUpdater
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

    /**
     * Ensure objects with this extension added are queryable via GraphQL.
     * This is often the case already by queries added through other modules.
     * Needs to be invoked explicitly via schema config:
     *
     * ```
     * config:
     *   execute: [ SilverStripe\SnapshotAdmin\SnapshotHistoryExtension ]
     * ```
     *
     * @param Schema $schema
     * @return void
     */
    public static function updateSchema(Schema $schema): void
    {
        foreach (ClassInfo::subclassesFor(DataObject::class) as $class) {
            if (DataObject::singleton($class)->hasExtension(static::class)) {
                $schema->addModelbyClassName($class, function ($model) {
                    $model->addOperation('readOne');
                });
            }
        }
    }
}
