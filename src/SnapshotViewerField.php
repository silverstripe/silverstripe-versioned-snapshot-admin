<?php

namespace SilverStripe\SnapshotAdmin;

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
}
