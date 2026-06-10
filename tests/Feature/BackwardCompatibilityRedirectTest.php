<?php

namespace Tests\Feature;

use Tests\TestCase;

class BackwardCompatibilityRedirectTest extends TestCase
{
    /**
     * Test that navigating to /recap/ledger/{active_class} redirects to /recap/class/{active_class}?tab=ledger
     */
    public function test_old_ledger_url_redirects_to_new_route_with_tab_parameter(): void
    {
        $classId = 1;
        
        // We're testing the route redirect, not authentication
        // The redirect should happen before authentication middleware
        $response = $this->withoutMiddleware()->get("/recap/ledger/{$classId}");
        
        $response->assertRedirect(route('recap.class.show', [
            'active_class' => $classId,
            'tab' => 'ledger'
        ]));
    }

    /**
     * Test that the redirect preserves the class ID
     */
    public function test_redirect_preserves_class_id(): void
    {
        $classId1 = 5;
        $classId2 = 10;
        
        $response1 = $this->withoutMiddleware()->get("/recap/ledger/{$classId1}");
        $response1->assertRedirect(route('recap.class.show', [
            'active_class' => $classId1,
            'tab' => 'ledger'
        ]));
        
        $response2 = $this->withoutMiddleware()->get("/recap/ledger/{$classId2}");
        $response2->assertRedirect(route('recap.class.show', [
            'active_class' => $classId2,
            'tab' => 'ledger'
        ]));
    }

    /**
     * Test that the redirect includes the ?tab=ledger parameter
     */
    public function test_redirect_includes_tab_ledger_parameter(): void
    {
        $classId = 1;
        
        $response = $this->withoutMiddleware()->get("/recap/ledger/{$classId}");
        
        $redirectUrl = $response->headers->get('Location');
        
        $this->assertStringContainsString('tab=ledger', $redirectUrl);
    }

    /**
     * Test that the named route recap.ledger.show still exists
     */
    public function test_named_route_recap_ledger_show_exists(): void
    {
        $classId = 1;
        
        // This will throw an exception if the route doesn't exist
        $url = route('recap.ledger.show', ['active_class' => $classId]);
        
        $this->assertStringContainsString("/recap/ledger/{$classId}", $url);
    }
}
