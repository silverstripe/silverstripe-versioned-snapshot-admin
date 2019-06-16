<?php

namespace SilverStripe\SnapshotAdmin;

use Exception;
use GraphQL\Type\Definition\ResolveInfo;
use SilverStripe\GraphQL\OperationResolver;
use SilverStripe\GraphQL\Scaffolding\Scaffolders\ListQueryScaffolder;
use SilverStripe\ORM\DataObject;
use SilverStripe\Snapshots\SnapshotPublishable;
use SilverStripe\Versioned\Versioned;

if (!class_exists(ListQueryScaffolder::class)) {
    return;
}

class ReadSnapshotHistory extends ListQueryScaffolder implements OperationResolver
{
    /**
     * ReadOperationScaffolder constructor.
     *
     * @param string $dataObjectClass
     * @param string $snapshotTypeName
     */
    public function __construct($dataObjectClass, $snapshotTypeName)
    {
        $this->setDataObjectClass($dataObjectClass);
        $operationName = 'read' . ucfirst($snapshotTypeName);

        parent::__construct($operationName, $snapshotTypeName, $this);
    }

    public function resolve($object, array $args, $context, ResolveInfo $info)
    {
        /** @var DataObject&Versioned&SnapshotPublishable $object */
        if (!$object->hasExtension(SnapshotPublishable::class)) {
            throw new Exception(sprintf(
                'Types using the %s query scaffolder must have the SnapshotPublishable extension applied. (See %s)',
                __CLASS__,
                $this->getDataObjectClass()
            ));
        }
        if (!$object->canViewStage(Versioned::DRAFT, $context['currentUser'])) {
            throw new Exception(sprintf(
                'Cannot view snapshots on %s',
                $this->getDataObjectClass()
            ));
        }

        // Get all snapshots
        $list = $object->getRelevantSnapshots();

        $this->extend('updateList', $list, $object, $args, $context, $info);

        return $list;
    }
}
