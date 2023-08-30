## SilverStripe Versioned Snapshot Admin

[![Build Status](https://github.com/silverstripe/silverstripe-versioned-snapshot-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/silverstripe/silverstripe-versioned-snapshot-admin/actions/workflows/ci.yml)
[![Latest Stable Version](http://poser.pugx.org/silverstripe/versioned-snapshot-admin/v)](https://packagist.org/packages/silverstripe/versioned-snapshot-admin)
[![Total Downloads](http://poser.pugx.org/silverstripe/versioned-snapshot-admin/downloads)](https://packagist.org/packages/silverstripe/versioned-snapshot-admin)
[![Latest Unstable Version](http://poser.pugx.org/silverstripe/versioned-snapshot-admin/v/unstable)](https://packagist.org/packages/silverstripe/versioned-snapshot-admin)
[![License](http://poser.pugx.org/silverstripe/versioned-snapshot-admin/license)](https://packagist.org/packages/silverstripe/versioned-snapshot-admin)
[![PHP Version Require](http://poser.pugx.org/silverstripe/versioned-snapshot-admin/require/php)](https://packagist.org/packages/silverstripe/versioned-snapshot-admin)

## What does this offer over versioned-admin?

Most of the value of snapshots are explained in the [versioned-snapshots](https://github.com/silverstripe/silverstripe-versioned-snapshots) README file, but the major takeaway is that this history viewer will show you the changes that have happened to objects in your `$owns` tree as if it is native history to the owner object. In other words, it helps authors to see the answer to the question, "What happens when I publish this page?"

Further, since each snapshot provides a timestamp, it is possible to view a page at a time when a given owned object was added or changed.

## Overview

Provides a drop-in replacement UI for [versioned-admin](https://github.com/silverstripe/silverstripe-versioned-admin)
that adds snapshots to the history view.

WARNING: This module is experimental, and not considered stable.

## History view -- anywhere!

Just add the `SnapshotHistoryExtension` included with this module to your dataobject, and a "History" tab will be provided to its `getCMSFields()` function, offering a list of its snapshot history.

## Installation

```
$ composer require silverstripe/versioned-snapshot-admin
```

## Versioning

This library follows [Semver](http://semver.org). According to Semver,
you will be able to upgrade to any minor or patch version of this library
without any breaking changes to the public API. Semver also requires that
we clearly define the public API for this library.

All methods, with `public` visibility, are part of the public API. All
other methods are not part of the public API. Where possible, we'll try
to keep `protected` methods backwards-compatible in minor/patch versions,
but if you're overriding methods then please test your work before upgrading.

## Reporting Issues

Please [create an issue](http://github.com/silverstripe/silverstripe-versioned-snapshot-admin/issues)
for any bugs you've found, or features you're missing.

## License

This module is released under the [BSD 3-Clause License](LICENSE)
