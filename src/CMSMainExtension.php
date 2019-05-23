<?php

namespace SilverStripe\SnapshotAdmin;

use SilverStripe\Core\Extension;
use SilverStripe\View\Requirements;

class CMSMainExtension extends Extension
{
    public function init()
    {
        Requirements::javascript('silverstripe/versioned-snapshot-admin:client/dist/js/bundle.js');
        Requirements::css('silverstripe/versioned-snapshot-admin:client/dist/styles/bundle.css');
    }
}
