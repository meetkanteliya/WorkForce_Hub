import { test, expect } from '@playwright/test';

test.describe('logout redirect', () => {
  test('redirects to landing page after sign out confirm', async ({ page }) => {
    // Simulate an authenticated session for AuthContext + axios interceptor.
    await page.addInitScript(() => {
      const tokens = { access: 'test-access', refresh: 'test-refresh' };
      const user = { id: 1, username: 'tester', role: 'admin' };
      localStorage.setItem('tokens', JSON.stringify(tokens));
      localStorage.setItem('user', JSON.stringify(user));
      // DepartmentChat reads this key (even if not routed); keep it consistent.
      localStorage.setItem('access', tokens.access);
    });

    // Mock all API calls so the app can render without a running backend.
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/dashboard/notifications/')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ unread_count: 0, results: [] }),
        });
      }

      if (url.includes('/api/employees/me/')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ profile_picture: null }),
        });
      }

      if (url.includes('/api/dashboard/summary/')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            last_updated: new Date().toISOString(),
            total_employees: 0,
            active_employees: 0,
            employees_on_leave_today: 0,
            pending_requests_total: 0,
            total_departments: 0,
            present_today: 0,
            upcoming_leaves: 0,
            leave_counts: { pending: 0, approved: 0, rejected: 0 },
            role_distribution: {},
            department_counts: [],
            new_joiners_this_month: 0,
            recently_added_employees: [],
            recent_activity: [],
          }),
        });
      }

      // Default: return empty data for any other API endpoint
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [], count: 0, next: null, previous: null }),
      });
    });

    await page.goto('/dashboard');

    // Open signout modal
    await page.getByRole('button', { name: 'Sign Out' }).click();

    // Confirm signout
    await page.getByRole('button', { name: 'Yes, Sign Out' }).click();

    // Should redirect to landing page
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('WorkForce Hub', { exact: false })).toBeVisible();
  });
});

