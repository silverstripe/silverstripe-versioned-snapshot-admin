<?php


namespace SilverStripe\SnapshotAdmin;

use SilverStripe\GraphQL\Manager;
use SilverStripe\GraphQL\Scaffolding\StaticSchema;
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
        // Holy hack! setTypeNames() only gets applied when the Manager is bootstrapped,
        // in a /graphql call, so it's not available in the context of a form schema API call.
        $schemaConfig = Manager::config()->get('schemas');
        $typeNames = $schemaConfig['admin']['typeNames'] ?? [];
        StaticSchema::inst()->setTypeNames($typeNames);

        $data = parent::getSchemaDataDefaults();
        $record = $this->getSourceRecord();
        $data['data'] = array_merge($data['data'], [
            'typeName' => StaticSchema::inst()->typeNameForDataObject($record->baseClass()),
        ]);

        return $data;
    }
}
