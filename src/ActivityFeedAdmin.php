<?php

namespace SilverStripe\SnapshotAdmin;

use ReflectionException;
use SilverStripe\Admin\CMSEditLinkExtension;
use SilverStripe\Admin\ModelAdmin;
use SilverStripe\Core\ClassInfo;
use SilverStripe\Forms\DropdownField;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\GridField\GridFieldAddNewButton;
use SilverStripe\Forms\GridField\GridFieldDataColumns;
use SilverStripe\Forms\GridField\GridFieldDeleteAction;
use SilverStripe\Forms\GridField\GridFieldEditButton;
use SilverStripe\Forms\GridField\GridFieldFilterHeader;
use SilverStripe\Forms\GridField\GridFieldImportButton;
use SilverStripe\ORM\DataObject;
use SilverStripe\ORM\FieldType\DBField;
use SilverStripe\Security\Member;
use SilverStripe\Snapshots\Snapshot;
use SilverStripe\Versioned\Versioned;

class ActivityFeedAdmin extends ModelAdmin
{
    private const string ACTIVITY_TAB = 'activity-feed';

    private static array $managed_models = [
        self::ACTIVITY_TAB => [
            'title' => 'Activity feed',
            'dataClass' => Snapshot::class,
        ],
    ];

    private static string $menu_title = 'Activity feed';

    private static string $url_segment = 'snapshots-feed-admin';

    private static string $menu_icon_class = 'font-icon-monitor';

    protected function getGridField(): GridField
    {
        $this->beforeExtending('updateGridField', function (GridField $gridField): void {
            $this->applyActivityFeedConfig($gridField);
        });

        return parent::getGridField();
    }

    /**
     * @param GridField $gridField
     * @return void
     * @throws ReflectionException
     */
    private function applyActivityFeedConfig(GridField $gridField): void
    {
        $modelTab = $this->modelTab;

        if ($modelTab !== self::ACTIVITY_TAB) {
            return;
        }

        // Most recent first
        $list = $gridField->getList();
        $list = $list->sort('LastEdited', 'DESC');
        $gridField->setList($list);

        $config = $gridField->getConfig();

        /** @var GridFieldFilterHeader $filterHeader */
        $filterHeader = $config->getComponentByType(GridFieldFilterHeader::class);

        if ($filterHeader) {
            $searchContext = $filterHeader->getSearchContext($gridField);
            $searchFields = $searchContext->getSearchFields();

            /** @var DropdownField $originClassField */
            $originClassField = $searchFields->fieldByName('OriginClass');

            // Narrow down class selection to only base classes as that's what's stored on the snapshot records
            if ($originClassField) {
                $baseClasses = [];
                $classes = ClassInfo::subclassesFor(DataObject::class);

                foreach ($classes as $class) {
                    // Skipping root class (treated as abstract)
                    if ($class === DataObject::class) {
                        continue;
                    }

                    $model = DataObject::singleton($class);

                    // Non-versioned models are not covered by this feature
                    if (!$model->hasExtension(Versioned::class)) {
                        continue;
                    }

                    // Generate a human readable label
                    $baseClass = $model->baseClass();
                    $baseModel = DataObject::singleton($baseClass);
                    $label = $baseModel->i18n_singular_name() ?: $baseClass;

                    $baseClasses[$baseClass] = $label;
                }
                ksort($baseClasses);

                $originClassField->setSource($baseClasses);
            }

            $authorIdField = $searchFields->fieldByName('AuthorID');

            // Replace author field with a simple dropdown field
            if ($authorIdField) {
                $authorValues = Member::get()
                    ->sort('Surname', 'ASC')
                    ->map('ID', 'Title')
                    ->toArray();
                $authorSelectionField = DropdownField::create($authorIdField->getName(), $authorIdField->Title(), $authorValues);
                $authorSelectionField->setEmptyString('(Any)');
                $searchFields->replaceField($authorIdField->getName(), $authorSelectionField);
            }
        }

        /** @var GridFieldDataColumns $dataColumns */
        $dataColumns = $config->getComponentByType(GridFieldDataColumns::class);

        if ($dataColumns) {
            $displayFields = $dataColumns->getDisplayFields($gridField);
            $displayFields['OriginObjectType'] = [
                'title' => 'Model type',
                'callback' => function (Snapshot $snapshot): mixed {
                    /** @var DataObject|CMSEditLinkExtension $origin */
                    $origin = $snapshot->Origin();

                    // We don't have a valid origin model available anymore, fall back to default behaviour
                    if (!$origin->isInDB()) {
                        return $snapshot->getOriginObjectType();
                    }

                    // Augment the title label to include model type as well
                    $titleLabel = sprintf('%s (%s)', $origin->Title, $origin->i18n_singular_name());

                    // Origin doesn't have an edit link, use Title as plain text
                    if (!$origin->hasExtension(CMSEditLinkExtension::class)) {
                        return $titleLabel;
                    }

                    // We do have an edit link - generate an edit link markup
                    $link = $origin->CMSEditLink();
                    $linkMarkup = sprintf('<a href="%s" target="_top">%s</a>', $link, $titleLabel);

                    return DBField::create_field('HTMLVarchar', $linkMarkup);
                }
            ];
            $dataColumns->setDisplayFields($displayFields);
        }

        $config->removeComponentsByType([
            // Remove new data related components as this is meant to be only read-only view
            GridFieldEditButton::class,
            GridFieldDeleteAction::class,
            GridFieldAddNewButton::class,
            GridFieldImportButton::class,
        ]);
    }
}
