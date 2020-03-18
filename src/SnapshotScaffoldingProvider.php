<?php


namespace SilverStripe\SnapshotAdmin;

use SilverStripe\Core\ClassInfo;
use SilverStripe\GraphQL\Scaffolding\Interfaces\ScaffoldingProvider;
use SilverStripe\GraphQL\Scaffolding\Scaffolders\SchemaScaffolder;
use SilverStripe\ORM\DataObject;

class SnapshotScaffoldingProvider implements ScaffoldingProvider
{
    /**
     * @param SchemaScaffolder $scaffolder
     * @throws \ReflectionException
     */
    public function provideGraphQLScaffolding(SchemaScaffolder $scaffolder)
    {
        foreach (ClassInfo::subclassesFor(DataObject::class, false) as $class) {
            /* @var DataObject|SnapshotHistoryExtension $inst */
            $inst = $class::singleton();
            if (!$inst->hasExtension(SnapshotHistoryExtension::class)) {
                continue;
            }
            if (!$inst->isSnapshotable()) {
                continue;
            }
            $scaffolder->type($inst->baseClass())
                ->addFields(['ID', 'AbsoluteLink'])
                ->operation(SchemaScaffolder::READ_ONE)
                    ->end()
                ->operation('rollback');
        }
    }
}
