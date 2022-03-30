<?php

namespace SilverStripe\SnapshotAdmin;

use GraphQL\Type\Definition\EnumType;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use SilverStripe\GraphQL\Manager;
use SilverStripe\GraphQL\Scaffolding\Scaffolders\DataObjectScaffolder;
use SilverStripe\GraphQL\Scaffolding\StaticSchema;
use SilverStripe\ORM\FieldType\DBField;
use SilverStripe\Security\Member;
use SilverStripe\Snapshots\ActivityEntry;
use SilverStripe\Snapshots\SnapshotPublishable;
use SilverStripe\Versioned\GraphQL\Extensions\DataObjectScaffolderExtension as VersionedDataObjectScaffolderExtension;
use SilverStripe\Versioned\Versioned;

if (!class_exists(Manager::class)) {
    return;
}

/**
 * @method DataObjectScaffolder|$this getOwner()
 */
class DataObjectScaffolderExtension extends VersionedDataObjectScaffolderExtension
{
    /**
     * @var EnumType
     */
    protected $activityEnum;

    /**
     * Adds the "Version" and "Versions" fields to any dataobject that has the Versioned extension.
     * Extension point in @see DataObjectScaffolder::addToManager()
     *
     * @param Manager $manager
     */
    public function onBeforeAddToManager(Manager $manager): void
    {
        $owner = $this->getOwner();

        $instance = $owner->getDataObjectInstance();
        $class = $owner->getDataObjectClass();

        if (!$instance->hasExtension(SnapshotPublishable::class) || !$instance->hasExtension(Versioned::class)) {
            return;
        }

        $versionTypeName = $this->createVersionedTypeName($class);
        $memberType = StaticSchema::inst()->typeNameForDataObject(Member::class);
        $snapshotName = $this->createTypeName($class);
        $snapshotType = new ObjectType([
            'name' => $snapshotName,
            'fields' => function () use ($manager, $versionTypeName, $memberType) {
                return [
                    'id' => Type::id(),
                    'lastEdited' => Type::string(),
                    'activityDescription' => Type::string(),
                    'activityType' => $this->createActivityEnum(),
                    'activityAgo' => Type::string(),
                    'originVersion' => $manager->getType($versionTypeName),
                    'author' => $manager->getType($memberType),
                    'isFullVersion' => Type::boolean(),
                    'isLiveSnapshot' => Type::boolean(),
                    'baseVersion' => Type::int(),
                    'message' => Type::string(),
                ];
            },
            'resolveField' => static function ($obj, $args, $context, ResolveInfo $info) {
                $fieldName = $info->fieldName === 'id'
                    ? 'ID'
                    : ucfirst($info->fieldName);

                $result = $obj->obj($fieldName);

                if ($result instanceof DBField) {
                    return $result->getValue();
                }

                return $result;
            },
        ]);

        $manager->addType($snapshotType, $snapshotName);

        $owner
            ->nestedQuery('SnapshotHistory', new ReadSnapshotHistory($class, $snapshotName));
    }

    protected function createActivityEnum(): EnumType
    {
        if (!$this->activityEnum) {
            $this->activityEnum = new EnumType([
                'name' => 'SnapshotActivityType',
                'values' => [
                    ActivityEntry::ADDED,
                    ActivityEntry::CREATED,
                    ActivityEntry::DELETED,
                    ActivityEntry::MODIFIED,
                    ActivityEntry::PUBLISHED,
                    ActivityEntry::UNPUBLISHED,
                    ActivityEntry::REMOVED,
                ],
            ]);
        }

        return $this->activityEnum;
    }

    /**
     * @param string $class
     * @return string
     */
    protected function createTypeName(string $class): string
    {
        return StaticSchema::inst()->typeNameForDataObject($class) . 'Snapshot';
    }
}
