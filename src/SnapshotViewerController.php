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
     * Define the URL segment for this controller
     * @var string
     */
    private static string $url_segment = 'snapshot-history-viewer';

    /**
     * Allow the apiRead method to be called via URL
     * @var array
     */
    private static array $allowed_actions = [
        'apiRead',
    ];

    /**
     * Map the 'read' URL segment to the apiRead method
     * @var array
     */
    private static array $url_handlers = [
        'GET read' => 'apiRead',
    ];

    /**
     * Expose the endpoint URL to the React frontend
     * This allows Config.getSection(...).endpoints.read to work
     * @return array
     */
    public function getClientConfig(): array
    {
        $config = parent::getClientConfig();
        $config['endpoints'] = [
            'read' => $this->Link('read'),
        ];
        return $config;
    }

    /**
     * @param HTTPRequest $request
     * @return HTTPResponse
     * @throws HTTPResponse_Exception
     * @throws Exception
     */
    public function apiRead(HTTPRequest $request): HTTPResponse
    {
        // Support both naming conventions
        $id = (int) ($request->getVar('id') ?? $request->getVar('record_id'));
        $dataClass = $request->getVar('dataClass') ?? $request->getVar('record_class');
        $page = (int) $request->getVar('page');

        if (!$page) {
            $page = 1;
        }

        // Validate inputs
        if (!$id || !$dataClass) {
            return $this->jsonResponse(['error' => 'Missing id or dataClass'], 400);
        }

        /** @var DataObject|Versioned|SnapshotPublishable $model */
        try {
            $model = $this->getDataObject($id, $dataClass);
        } catch (Exception $e) {
            return $this->jsonResponse(['error' => 'Record not found'], 404);
        }

        if (!$model->canView()) {
            return $this->jsonResponse(['error' => 'Forbidden'], 403);
        }

        // Required extension is missing
        if (!$model->hasExtension(SnapshotPublishable::class)) {
            return $this->jsonResponse(['error' => 'Snapshot extension missing'], 400);
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
            $isFullVersion = $record->OriginHash === $objectHash &&
                $record->getActivityType() !== ActivityEntry::DELETED;

            /** @var DataObject|Versioned $originVersion */
            $originVersion = $record->getOriginVersion();
            $originVersionLink = $originVersion->hasMethod('AbsoluteLink')
                ? $originVersion->AbsoluteLink()
                : null;

            // Build the response object
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

        return $this->jsonResponse($data);
    }

    /**
     * Helper to return JSON response
     */
    protected function jsonResponse(array $data, int $code = 200): HTTPResponse
    {
        $response = HTTPResponse::create();
        $response->addHeader('Content-Type', 'application/json');
        $response->setStatusCode($code);
        $response->setBody(json_encode($data));
        return $response;
    }

    /**
     * Copied from parent class
     * @throws Exception
     */
    private function getDataObject(int $id, string $dataClass): DataObject
    {
        if (!$dataClass || !class_exists($dataClass) || !is_subclass_of($dataClass, DataObject::class)) {
            throw new Exception("Invalid data class");
        }

        $obj = Versioned::get_all_versions($dataClass, $id)->first();

        if (!$obj) {
            throw new Exception("Object not found");
        }

        return $obj;
    }
}
