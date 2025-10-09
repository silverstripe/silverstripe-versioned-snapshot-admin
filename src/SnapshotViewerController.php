<?php

namespace SilverStripe\SnapshotAdmin;

use Exception;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\HTTPResponse;
use SilverStripe\Control\HTTPResponse_Exception;
use SilverStripe\ORM\DataObject;
use SilverStripe\Snapshots\ActivityEntry;
use SilverStripe\Snapshots\Snapshot;
use SilverStripe\Snapshots\SnapshotPublishable;
use SilverStripe\Versioned\Versioned;
use SilverStripe\VersionedAdmin\Controllers\HistoryViewerController;
use SilverStripe\VersionedAdmin\Forms\HistoryViewerField;

class SnapshotViewerController extends HistoryViewerController
{
    /**
     * This is needed to preserve the naming convention of the JS config
     * Without this the frontend integration of our override won't work as the section name
     * is hard coded in the frontend components
     *
     * @var string|null
     */
    private static ?string $section_name = HistoryViewerController::class;

    /**
     * @param HTTPRequest $request
     * @return HTTPResponse
     * @throws HTTPResponse_Exception
     * @throws Exception
     */
    public function apiRead(HTTPRequest $request): HTTPResponse
    {
        $id = (int) $request->getVar('id');
        $dataClass = $request->getVar('dataClass') ?? '';
        $page = (int) $request->getVar('page');

        if (!$page) {
            $page = 1;
        }

        /** @var DataObject|Versioned|SnapshotPublishable $model */
        $model = $this->getDataObject($id, $dataClass, 404);

        if (!$model->canView()) {
            $this->jsonError(403);
        }

        // Required extension is missing
        if (!$model->hasExtension(SnapshotPublishable::class)) {
            $this->jsonError(403);
        }

        // Get all snapshots
        $list = $model->getRelevantSnapshots();
        $totalCount = $list->count();
        $limit = HistoryViewerField::config()->get('default_page_size');
        $offset = $limit * ($page - 1);
        $list = $list->sort('LastEdited', 'DESC');
        $list = $list->limit($limit, $offset);
        $versions = [];

        $objectHash = SnapshotPublishable::singleton()->hashObjectForSnapshot($model);

        /** @var Snapshot $record */
        foreach ($list as $record) {
            $author = $record->Author();
            $isFullVersion = $record->OriginHash === $objectHash && $record->getActivityType() !== ActivityEntry::DELETED;

            /** @var DataObject|Versioned $originVersion */
            $originVersion = $record->getOriginVersion();
            $originVersionLink = $originVersion->hasMethod('AbsoluteLink')
                ? $originVersion->AbsoluteLink()
                : null;

            $versions[] = [
                'id' => $record->ID,
                'lastEdited' => $record->LastEdited,
                'activityDescription' => $record->getActivityDescription(),
                'activityType' => $record->getActivityType(),
                'activityAgo' => $record->getActivityAgo(),
                'originVersion' => [
                    'version' => $originVersion->Version,
                    'absoluteLink' => $originVersionLink,
                    'author' => $originVersion->Author(),
                    'published' => $originVersion->isPublished(),
                    'publisher' => $originVersion->Publisher(),
                    'latestDraftVersion' => $originVersion->isLatestDraftVersion(),
                ],
                'author' => [
                    'firstName' => $author ? $author->FirstName : '',
                    'surname' => $author ? $author->Surname : '',
                ],
                'isFullVersion' => $isFullVersion,
                'isLiveSnapshot' => $record->getIsLiveSnapshot(),
                // This field is populated via alias in SnapshotPublishableExtension
                'baseVersion' => $record->baseVersion,
            ];
        }

        $data = [
            'pageInfo' => [
                'totalCount' => $totalCount,
            ],
            'versions' => $versions,
        ];

        $this->extend('updateApiRead', $data, $request);

        return $this->jsonSuccess(200, $data);
    }

    /**
     * Copied without modification from parent class due to the method being private
     *
     * @param int $id
     * @param string $dataClass
     * @param int $missingObjectError
     * @return DataObject
     * @throws HTTPResponse_Exception
     */
    private function getDataObject(int $id, string $dataClass, int $missingObjectError): DataObject
    {
        if (!$id) {
            $this->jsonError($missingObjectError);
        }

        if (!$dataClass || !class_exists($dataClass) || !is_a($dataClass, DataObject::class, true)) {
            $this->jsonError(400);
        }

        $obj = Versioned::get_all_versions($dataClass, $id)->first();

        if (!$obj) {
            $this->jsonError($missingObjectError);
        }

        if (!$obj->hasExtension(Versioned::class)) {
            $this->jsonError(400);
        }

        return $obj;
    }
}
