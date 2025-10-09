<?php

namespace SilverStripe\SnapshotAdmin\Tests;

use Page;
use Psr\Container\NotFoundExceptionInterface;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\HTTPResponse_Exception;
use SilverStripe\Core\Validation\ValidationException;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\ORM\FieldType\DBDatetime;
use SilverStripe\SnapshotAdmin\SnapshotViewerController;
use SilverStripe\Snapshots\Snapshot;
use SilverStripe\Snapshots\SnapshotEvent;
use SilverStripe\Snapshots\SnapshotItem;

class SnapshotViewerControllerTest extends SapphireTest
{
    /**
     * @var string
     */
    protected static $fixture_file = 'SnapshotViewerControllerTest.yml';

    /**
     * @var array
     */
    protected static $extra_dataobjects = [
        SnapshotItem::class,
        Snapshot::class,
        SnapshotEvent::class,
        Page::class,
    ];

    /**
     * @return void
     * @throws NotFoundExceptionInterface
     * @throws ValidationException
     */
    protected function setUp(): void
    {
        // Fix the time so we can assert the data more easily
        DBDatetime::set_mock_now('2025-01-01 00:00:00');

        parent::setUp();

        /** @var Page $page */
        $page = $this->objFromFixture(Page::class, 'page1');

        // Create some mock snapshot data
        $this->logInWithPermission('ADMIN');

        $initialSnapshot = Snapshot::singleton()->createSnapshot($page);
        $initialSnapshot->write();

        $page->MetaDescription = 'Some update';
        $page->write();
        $customSnapshot = Snapshot::singleton()->createSnapshotEvent('Custom event', [
            $page,
        ]);
        $customSnapshot->OriginID = $page->ID;
        $customSnapshot->OriginClass = $page->baseClass();
        $customSnapshot->write();

        $page->publishSingle();
        $publishedSnapshot = Snapshot::singleton()->createSnapshot($page);

        // Mark this snapshot as "no modifications" as we have just published all changes
        $publishedSnapshot->write();
        $publishedSnapshot->markNoModifications();
    }

    /**
     * @return void
     * @throws HTTPResponse_Exception
     */
    public function testApiRead(): void
    {
        /** @var Page $page */
        $page = $this->objFromFixture(Page::class, 'page1');

        $mockRequest = new HTTPRequest(
            'GET',
            '/admin/historyviewer/api/read',
            [
                'id' => $page->ID,
                'dataClass' => $page->ClassName,
                'page' => 1,
            ]
        );
        $controller = SnapshotViewerController::create();
        $response = $controller->apiRead($mockRequest);

        $responseCode = $response->getStatusCode();
        $this->assertEquals(200, $responseCode, 'We expect a success response code');

        $body = $response->getBody();
        $this->assertNotEmpty($body, 'We expect response data to be present');

        $data = json_decode($body, true);
        $this->assertArrayHasKey('pageInfo', $data, 'We expect to see page info field');
        $this->assertArrayHasKey('versions', $data, 'We expect to see versions field');

        $pageInfo = $data['pageInfo'];
        $this->assertArrayHasKey('totalCount', $pageInfo, 'We expect to see total count field');
        $this->assertEquals(3, $pageInfo['totalCount'], 'We expect a specific total item count');

        $snapshots = Snapshot::get()
            ->sort('ID', 'ASC')
            ->toArray();

        /** @var Snapshot $firstSnapshot */
        $firstSnapshot = array_shift($snapshots);

        /** @var Snapshot $secondSnapshot */
        $secondSnapshot = array_shift($snapshots);

        /** @var Snapshot $thirdSnapshot */
        $thirdSnapshot = array_shift($snapshots);

        $expected = [
            [
                'id' => $firstSnapshot->ID,
                'lastEdited' => '2025-01-01 00:00:00',
                'activityDescription' => 'Page "Page 1"',
                'activityType' => 'MODIFIED',
                'activityAgo' => 'less than a minute ago',
                'originVersion' => [
                    'version' => 2,
                    'absoluteLink' => 'http://localhost/page1',
                    'author' => null,
                    'published' => true,
                    'publisher' => null,
                    'latestDraftVersion' => false,
                ],
                'author' => [
                    'firstName' => 'ADMIN',
                    'surname' => 'User',
                ],
                'isFullVersion' => true,
                'isLiveSnapshot' => false,
                'baseVersion' => 2,
            ],
            [
                'id' => $secondSnapshot->ID,
                'lastEdited' => '2025-01-01 00:00:00',
                'activityDescription' => 'Page "Page 1"',
                'activityType' => 'MODIFIED',
                'activityAgo' => 'less than a minute ago',
                'originVersion' => [
                    'version' => 3,
                    'absoluteLink' => 'http://localhost/page1',
                    'author' => [],
                    'published' => true,
                    'publisher' => null,
                    'latestDraftVersion' => false,
                ],
                'author' => [
                    'firstName' => 'ADMIN',
                    'surname' => 'User',
                ],
                'isFullVersion' => true,
                'isLiveSnapshot' => false,
                'baseVersion' => 3,
            ],
            [
                'id' => $thirdSnapshot->ID,
                'lastEdited' => '2025-01-01 00:00:00',
                'activityDescription' => 'Page "Page 1"',
                'activityType' => 'MODIFIED',
                'activityAgo' => 'less than a minute ago',
                'originVersion' => [
                    'version' => 4,
                    'absoluteLink' => 'http://localhost/page1',
                    'author' => [],
                    'published' => true,
                    'publisher' => [],
                    'latestDraftVersion' => true,
                ],
                'author' => [
                    'firstName' => 'ADMIN',
                    'surname' => 'User',
                ],
                'isFullVersion' => true,
                'isLiveSnapshot' => true,
                'baseVersion' => 4,
            ],
        ];
        $this->assertSame($expected, $data['versions'], 'We expect specific version data including order');
    }
}
