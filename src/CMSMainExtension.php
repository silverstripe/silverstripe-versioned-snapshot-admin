<?php

namespace SilverStripe\Snapshots;

use SilverStripe\Core\Extension;
use SilverStripe\View\Requirements;

class CMSMainExtension extends Extension
{
    public function init()
    {
        Requirements::javascript('silverstripe/versioned-snapshots:client/dist/js/bundle.js');
        Requirements::css('silverstripe/versioned-snapshots:client/dist/styles/bundle.css');
    }
}
