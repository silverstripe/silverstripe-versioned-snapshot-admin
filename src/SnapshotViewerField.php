<?php


namespace SilverStripe\SnapshotAdmin;

use SilverStripe\CMS\Model\SiteTree;
use SilverStripe\GraphQL\Manager;
use SilverStripe\GraphQL\Scaffolding\StaticSchema;
use SilverStripe\GraphQL\Schema\SchemaBuilder;
use SilverStripe\VersionedAdmin\Forms\HistoryViewerField;
use SilverStripe\View\Requirements;

class SnapshotViewerField extends HistoryViewerField
{

    protected $schemaComponent = 'SnapshotViewerContainer';

    public function __construct($name, $title = null, $value = null)
    {
        parent::__construct($name, $title, $value);
        Requirements::block('silverstripe/versioned-admin:client/dist/js/bundle.js');
        Requirements::block('silverstripe/versioned-admin:client/dist/styles/bundle.css');
    }

    public function Type(): string
    {
        return 'snapshot-history-viewer__container';
    }

    public function getName(): string
    {
        return 'snapshot-history-viewer__container';
    }

    public function getSchemaDataDefaults()
    {
        $data = parent::getSchemaDataDefaults();
        $record = $this->getSourceRecord();

        // GraphQL doesn't have any API for "hide ancestor", which we should support at some point
        // to avoid things like readSiteTree. "Page" is exposed by default
        $baseClass = $record->baseClass() === SiteTree::class ? 'Page' : $record->baseClass();
        $config = SchemaBuilder::singleton()->getConfig('admin');
        $data['data'] = array_merge($data['data'], [
            'typeName' => $config->getTypeNameForClass($baseClass),
        ]);
        return $data;
    }
}
