<?php

namespace SilverStripe\SnapshotAdmin;

use Exception;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\HTTPResponse;
use SilverStripe\Control\HTTPResponse_Exception;
use SilverStripe\Forms\Form;
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
     * @var array
     */
    private static array $allowed_actions = [
        'apiRead',
        'versionForm',
        'compareForm',
    ];

    /**
     * @var array
     */
    private static array $url_handlers = [
        'GET read' => 'apiRead',
    ];

    /**
     * Expose the REST endpoints to the React frontend
     */
    public function getClientConfig(): array
    {
        $config = parent::getClientConfig();

        $config['endpoints'] = array_merge($config['endpoints'] ?? [], [
            'read' => $this->Link('read'),
            'versionForm' => $this->Link('schema/versionForm'),
            'compareForm' => $this->Link('schema/compareForm'),
        ]);

        return $config;
    }

    /**
     * REST endpoint to fetch snapshot history payload
     */
    public function apiRead(HTTPRequest $request): HTTPResponse
    {
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

        $list = $list->sort('LastEdited', 'DESC')->limit($limit, $offset);
        $versions = [];

        $objectHash = SnapshotPublishable::singleton()->hashObjectForSnapshot($model);

        /** @var Snapshot $record */
        foreach ($list as $record) {
            $author = $record->Author();
            $isFullVersion = $record->OriginHash === $objectHash &&
                $record->getActivityType() !== ActivityEntry::DELETED;

            /** @var DataObject|Versioned $originVersion */
            $originVersion = $record->getOriginVersion();
            $originVersionLink = $originVersion && $originVersion->hasMethod('AbsoluteLink')
                ? $originVersion->AbsoluteLink()
                : null;

            // Build the response object
            $versions[] = [
                'id' => $record->ID,
                'lastEdited' => $record->LastEdited,
                'activityDescription' => $record->getActivityDescription(),
                'activityType' => $record->getActivityType(),
                'activityAgo' => $record->getActivityAgo(),
                'originVersion' => $originVersion ? [
                    'version' => $originVersion->Version,
                    'absoluteLink' => $originVersionLink,
                    'author' => $originVersion->Author() ? [
                        'firstName' => $originVersion->Author()->FirstName,
                        'surname' => $originVersion->Author()->Surname,
                    ] : [],
                    'published' => $originVersion->isPublished(),
                    'publisher' => $originVersion->Publisher() ? [
                        'firstName' => $originVersion->Publisher()->FirstName,
                        'surname' => $originVersion->Publisher()->Surname,
                    ] : [],
                    'latestDraftVersion' => $originVersion->isLatestDraftVersion(),
                ] : [],
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
            'pageInfo' => ['totalCount' => $totalCount],
            'versions' => $versions,
        ];

        $this->extend('updateApiRead', $data, $request);

        return $this->jsonResponse($data);
    }

    /**
     * REST schema endpoint for viewing a single version.
     * Intercepts the query string to map a Snapshot ID to a Core Version ID.
     */
    public function versionForm(?HTTPRequest $request = null): ?Form
    {
        $request = $request ?: $this->getRequest();
        if (!$request) {
            $this->jsonError(400);
            return null;
        }

        try {
            return $this->getVersionForm([
                'RecordClass' => $request->getVar('RecordClass'),
                'RecordID' => $request->getVar('RecordID'),
                'RecordVersion' => $this->resolveSnapshotToVersionNumber($request->getVar('RecordVersion')),
            ]);
        } catch (\InvalidArgumentException $ex) {
            $this->jsonError(400);
        }
    }

    /**
     * REST schema endpoint for comparing two versions.
     * Intercepts the query string to map Snapshot IDs to Core Version IDs.
     */
    public function compareForm(?HTTPRequest $request = null): ?Form
    {
        $request = $request ?: $this->getRequest();
        if (!$request) {
            $this->jsonError(400);
            return null;
        }

        try {
            return $this->getCompareForm([
                'RecordClass' => $request->getVar('RecordClass'),
                'RecordID' => $request->getVar('RecordID'),
                'RecordVersionFrom' => $this->resolveSnapshotToVersionNumber($request->getVar('RecordVersionFrom')),
                'RecordVersionTo' => $this->resolveSnapshotToVersionNumber($request->getVar('RecordVersionTo')),
            ]);
        } catch (\InvalidArgumentException $ex) {
            $this->jsonError(400);
        }
    }

    /**
     * Translates a frontend Snapshot ID into the underlying DataObject's Version Number.
     */
    private function resolveSnapshotToVersionNumber($snapshotID)
    {
        if ($snapshotID && class_exists(Snapshot::class)) {
            /** @var Snapshot $snapshot */
            $snapshot = Snapshot::get()->byID($snapshotID);
            if ($snapshot && $originVersion = $snapshot->getOriginVersion()) {
                return $originVersion->Version;
            }
        }
        return $snapshotID; // Fallback to raw value
    }

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
