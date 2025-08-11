<?php

namespace SilverStripe\SnapshotAdmin;

use SilverStripe\CMS\Controllers\CMSMain;
use SilverStripe\Core\Extension;
use SilverStripe\View\Requirements;

/**
 * @extends Extension<CMSMain>
 */
class CMSMainExtension extends Extension
{
    protected function onInit(): void
    {
        Requirements::javascript('silverstripe/versioned-snapshot-admin:client/dist/js/bundle.js');
        Requirements::css('silverstripe/versioned-snapshot-admin:client/dist/styles/bundle.css');
    }
}
