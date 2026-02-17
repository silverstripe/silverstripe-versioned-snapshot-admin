<?php

namespace SilverStripe\SnapshotAdmin;

use SilverStripe\SnapshotAdmin\SnapshotViewerController;
use SilverStripe\VersionedAdmin\Forms\HistoryViewerField;
use SilverStripe\View\Requirements;

class SnapshotViewerField extends HistoryViewerField
{
    /**
     * @var string
     */
    protected $schemaComponent = 'SnapshotViewerContainer';

    /**
     * @param mixed $name
     * @param mixed $title
     * @param mixed $value
     */
    public function __construct($name, $title = null, $value = null)
    {
        parent::__construct($name, $title, $value);

        // Block the default versioned-admin styles/scripts as we are replacing the viewer
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

    public function getSchemaDataDefaults(): array
    {
        $data = parent::getSchemaDataDefaults();

        $controller = SnapshotViewerController::singleton();

        // Expose the snapshot URL to the React component
        $data['data']['snapshotEndpoint'] = $controller->Link('read');

        return $data;
    }
}
