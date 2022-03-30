<?php

namespace SilverStripe\SnapshotAdmin;

use ReflectionException;
use SilverStripe\CMS\Model\SiteTree;
use SilverStripe\Core\ClassInfo;
use SilverStripe\GraphQL\Scaffolding\Interfaces\ScaffoldingProvider;
use SilverStripe\GraphQL\Scaffolding\Scaffolders\SchemaScaffolder;
use SilverStripe\ORM\DataObject;
use SilverStripe\Security\Member;

if (!interface_exists(ScaffoldingProvider::class)) {
    return;
}

class SnapshotScaffoldingProvider implements ScaffoldingProvider
{
    /**
     * @param SchemaScaffolder $scaffolder
     * @throws ReflectionException
     */
    public function provideGraphQLScaffolding(SchemaScaffolder $scaffolder): void
    {
        $scaffolder->type(Member::class)
            ->addFields(['FirstName','Surname']);

        if (class_exists(SiteTree::class)) {
            $scaffolder->type(SiteTree::class)
                ->addField('ClassName');
        }

        foreach (ClassInfo::subclassesFor(DataObject::class, false) as $class) {
            /** @var DataObject|SnapshotHistoryExtension $inst */
            $inst = $class::singleton();

            if (!$inst->hasExtension(SnapshotHistoryExtension::class)) {
                continue;
            }

            if (!$inst->isSnapshotable()) {
                continue;
            }

            $fields = ['ID', 'ClassName'];

            if ($inst->hasMethod('AbsoluteLink')) {
                $fields[] = 'AbsoluteLink';
            }

            $scaffolder->type($inst->baseClass())
                ->addFields($fields)
                ->operation(SchemaScaffolder::READ_ONE)
                    ->addArg('filter', 'IDFilterType!')
                ->end()
                ->operation('rollback');
        }
    }
}
