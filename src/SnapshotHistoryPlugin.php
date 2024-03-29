<?php

namespace SilverStripe\SnapshotAdmin;

use Exception;
use GraphQL\Type\Definition\ResolveInfo;
use ReflectionException;
use SilverStripe\Core\ClassInfo;
use SilverStripe\Core\Injector\Injector;
use SilverStripe\GraphQL\QueryHandler\UserContextProvider;
use SilverStripe\GraphQL\Schema\DataObject\Plugin\Paginator;
use SilverStripe\GraphQL\Schema\DataObject\Resolver;
use SilverStripe\GraphQL\Schema\Exception\SchemaBuilderException;
use SilverStripe\GraphQL\Schema\Field\ModelField;
use SilverStripe\GraphQL\Schema\Interfaces\ModelTypePlugin;
use SilverStripe\GraphQL\Schema\Interfaces\SchemaUpdater;
use SilverStripe\GraphQL\Schema\Schema;
use SilverStripe\GraphQL\Schema\Type\ModelType;
use SilverStripe\GraphQL\Schema\Type\Type;
use SilverStripe\ORM\ArrayList;
use SilverStripe\ORM\DataObject;
use SilverStripe\Security\Member;
use SilverStripe\Snapshots\ActivityEntry;
use SilverStripe\Snapshots\Snapshot;
use SilverStripe\Snapshots\SnapshotPublishable;
use SilverStripe\Versioned\Versioned;

class SnapshotHistoryPlugin implements ModelTypePlugin, SchemaUpdater
{
    const IDENTIFIER = 'snapshotHistory';

    public function getIdentifier(): string
    {
        return self::IDENTIFIER;
    }

    /**
     * @param Schema $schema
     * @throws ReflectionException
     * @throws SchemaBuilderException
     */
    public static function updateSchema(Schema $schema): void
    {
        // For dataobjects that have this extension, implicitly add them to the schema
        // and ensure readOne and rollback are activated.
        foreach (ClassInfo::subclassesFor(DataObject::class, false) as $class) {
            /** @var DataObject|SnapshotHistoryExtension $inst */
            $inst = $class::singleton();

            if (!$inst->hasExtension(SnapshotHistoryExtension::class) || !$inst->isSnapshotable()) {
                continue;
            }

            $fields = ['id', 'className'];

            if ($inst->hasMethod('absoluteLink')) {
                $fields[] = 'absoluteLink';
            }

            $schema->addModelbyClassName($inst->baseClass(), static function (ModelType $model) use ($fields): void {
                $model->addFields($fields)
                    ->addOperation('readOne')
                    ->addOperation('rollback');
            });
        }
    }

    /**
     * @param ModelType $type
     * @param Schema $schema
     * @param array $config
     * @throws SchemaBuilderException
     */
    public function apply(ModelType $type, Schema $schema, array $config = []): void
    {
        $class = $type->getModel()->getSourceClass();
        $inst = Injector::inst()->get($class);

        if (!$inst->hasExtension(SnapshotPublishable::class) || !$inst->hasExtension(Versioned::class)) {
            return;
        }

        $snapshotType = static::createSnapshotType($schema, $class);
        $schema->addType($snapshotType);

        $type->addField(
            'snapshotHistory',
            $snapshotType->getName(),
            static function (ModelField $field) use ($schema): void {
                $field->setResolver([static::class, 'resolve']);
                Paginator::create()->apply($field, $schema);
            }
        );
    }

    /**
     * @param Schema $schema
     * @param string $class
     * @return Type
     * @throws SchemaBuilderException
     */
    protected static function createSnapshotType(Schema $schema, string $class): Type
    {
        $versionName = $schema->getConfig()->getTypeNameForClass($class) . 'Version';
        $snapshotName = $schema->getConfig()->getTypeNameForClass($class) . 'Snapshot';
        $memberType = $schema->getConfig()->getTypeNameForClass(Member::class);

        return Type::create(
            $snapshotName,
            [
                'fields' => [
                    'id' => 'ID',
                    'lastEdited' => 'String',
                    'activityDescription' => 'String',
                    'activityType' => 'SnapshotActivityType',
                    'activityAgo' => 'String',
                    'originVersion' => $versionName,
                    'author' => $memberType,
                    'isFullVersion' => 'Boolean',
                    'isLiveSnapshot' => 'Boolean',
                    'baseVersion' => 'Int',
                    'message' => 'String',
                ],
                'fieldResolver' => [Resolver::class, 'baseResolve'],
            ]
        );
    }

    /**
     * @param mixed $object
     * @param array $args
     * @param mixed $context
     * @param ResolveInfo $info
     * @return ArrayList
     * @throws SchemaBuilderException
     * @throws Exception
     */
    public static function resolve($object, array $args, $context, ResolveInfo $info): ArrayList
    {
        /** @var DataObject&Versioned&SnapshotPublishable $object */
        Schema::invariant(
            $object->hasExtension(SnapshotPublishable::class),
            'Types using snapshot history must have the SnapshotPublishable extension applied. (See %s)',
            $object::class
        );

        $currentUser = UserContextProvider::get($context);

        if (!$object->canViewStage(Versioned::DRAFT, $currentUser)) {
            throw new Exception(sprintf(
                'Cannot view snapshots on %s',
                $object::class
            ));
        }

        // Get all snapshots
        $list = $object->getRelevantSnapshots();
        $list = $list->sort('LastEdited', 'DESC');
        // To check if the items are the full versions we compare their hashes against the objects hash
        // this is used in the frontend to show the user if the snapshot is from the object itself
        // or one of its children
        // The reason for doing this here is so that it behaves nicely with fluent, ideally this would
        // move to the frontend
        $objectHash = SnapshotPublishable::singleton()->hashObjectForSnapshot($object);
        $listWithAlterations = ArrayList::create();

        /** @var Snapshot $item */
        foreach ($list as $item) {
            $item->isFullVersion = $item->OriginHash === $objectHash &&
                $item->getActivityType() !== ActivityEntry::DELETED;
            $listWithAlterations->push($item);
        }

        return $listWithAlterations;
    }
}
