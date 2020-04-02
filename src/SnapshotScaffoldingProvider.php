<?php


namespace SilverStripe\SnapshotAdmin;

use SilverStripe\Core\ClassInfo;
use SilverStripe\GraphQL\Scaffolding\Interfaces\ScaffoldingProvider;
use SilverStripe\GraphQL\Scaffolding\Scaffolders\SchemaScaffolder;
use SilverStripe\ORM\DataObject;
use SilverStripe\Security\Member;

class SnapshotScaffoldingProvider implements ScaffoldingProvider
{
    /**
     * @param SchemaScaffolder $scaffolder
     * @throws \ReflectionException
     */
    public function provideGraphQLScaffolding(SchemaScaffolder $scaffolder)
    {
        $scaffolder->type(Member::class)
            ->addFields(['FirstName','Surname']);
        
        foreach (ClassInfo::subclassesFor(DataObject::class, false) as $class) {
            /* @var DataObject|SnapshotHistoryExtension $inst */
            $inst = $class::singleton();
            if (!$inst->hasExtension(SnapshotHistoryExtension::class)) {
                continue;
            }
            if (!$inst->isSnapshotable()) {
                continue;
            }
            $fields = ['ID'];
            if ($inst->hasMethod('AbsoluteLink')) {
                $fields[] = 'AbsoluteLink';
            }
            $scaffolder->type($inst->baseClass())
                ->addFields($fields)
                ->operation(SchemaScaffolder::READ_ONE)
                    ->end()
                ->operation('rollback');
        }
    }
}
