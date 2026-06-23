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
     * Origin version numbers captured from each write in setUp(), so assertions reference the
     * versions we actually wrote rather than hard-coded numbers.
     */
    private int $baseVersion;

    private int $modifiedVersion;

    private int $publishedVersion;

    /**
     * @return void
     * @throws NotFoundExceptionInterface
     * @throws ValidationException
     */
    protected function setUp(): void
    {
        // Give each snapshot a distinct, increasing timestamp so the controller's
        // "LastEdited DESC" sort is deterministic (newest first) rather than relying on an
        // undefined database tie-break between snapshots written at the same time.
        DBDatetime::set_mock_now('2025-01-01 00:00:00');

        parent::setUp();

        // Log in first so every version created below is attributed to a known author.
        $this->logInWithPermission('ADMIN');

        /** @var Page $page */
        $page = $this->objFromFixture(Page::class, 'page1');

        // Snapshot a version we authored rather than the unauthored fixture version; changing
        // a non-Title field keeps the activity description stable.
        $page->MetaDescription = 'Initial';
        $page->write();
        $this->baseVersion = (int) $page->Version;
        $initialSnapshot = Snapshot::singleton()->createSnapshot($page);
        $initialSnapshot->write();

        DBDatetime::set_mock_now('2025-01-01 00:00:01');
        $page->MetaDescription = 'Some update';
        $page->write();
        $this->modifiedVersion = (int) $page->Version;
        $customSnapshot = Snapshot::singleton()->createSnapshotEvent('Custom event', [
            $page,
        ]);
        $customSnapshot->OriginID = $page->ID;
        $customSnapshot->OriginClass = $page->baseClass();
        $customSnapshot->write();

        DBDatetime::set_mock_now('2025-01-01 00:00:02');
        $page->publishSingle();
        $this->publishedVersion = (int) $page->Version;
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

        // Newest first, matching the controller's "LastEdited DESC" sort: the published
        // snapshot, then the custom event, then the initial snapshot.
        $expected = [
            [
                'id' => $thirdSnapshot->ID,
                'lastEdited' => '2025-01-01 00:00:02',
                'activityDescription' => 'Page "Page 1"',
                'activityType' => 'MODIFIED',
                'activityAgo' => 'less than a minute ago',
                'originVersion' => [
                    'version' => $this->publishedVersion,
                    'absoluteLink' => 'http://localhost/page1',
                    'author' => [
                        'firstName' => 'ADMIN',
                        'surname' => 'User',
                    ],
                    'published' => true,
                    'publisher' => [
                        'firstName' => 'ADMIN',
                        'surname' => 'User',
                    ],
                    'latestDraftVersion' => true,
                ],
                'author' => [
                    'firstName' => 'ADMIN',
                    'surname' => 'User',
                ],
                'isFullVersion' => true,
                'isLiveSnapshot' => true,
                'baseVersion' => $this->publishedVersion,
            ],
            [
                'id' => $secondSnapshot->ID,
                'lastEdited' => '2025-01-01 00:00:01',
                'activityDescription' => 'Page "Page 1"',
                'activityType' => 'MODIFIED',
                'activityAgo' => 'less than a minute ago',
                'originVersion' => [
                    'version' => $this->modifiedVersion,
                    'absoluteLink' => 'http://localhost/page1',
                    'author' => [
                        'firstName' => 'ADMIN',
                        'surname' => 'User',
                    ],
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
                'baseVersion' => $this->modifiedVersion,
            ],
            [
                'id' => $firstSnapshot->ID,
                'lastEdited' => '2025-01-01 00:00:00',
                'activityDescription' => 'Page "Page 1"',
                'activityType' => 'MODIFIED',
                'activityAgo' => 'less than a minute ago',
                'originVersion' => [
                    'version' => $this->baseVersion,
                    'absoluteLink' => 'http://localhost/page1',
                    'author' => [
                        'firstName' => 'ADMIN',
                        'surname' => 'User',
                    ],
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
                'baseVersion' => $this->baseVersion,
            ],
        ];
        $this->assertSame($expected, $data['versions'], 'We expect specific version data including order');
    }
}
