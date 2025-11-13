# CSP Violation Reporting Setup Guide

**Date:** November 13, 2025
**Purpose:** Monitor Content Security Policy violations in production
**Status:** Configured with Report-Only mode

---

## Overview

Content Security Policy (CSP) violation reporting has been configured to monitor potential security issues in production. The system uses **Report-Only mode** initially to avoid breaking existing functionality while collecting violation data.

### Configuration Details

**Reporting Service:** report-uri.com (Free tier available)
**Endpoint URL:** `https://aiborg.report-uri.com/r/d/csp/reportOnly`
**Report Format:** Both `report-uri` (legacy) and `report-to` (modern) directives

---

## Setup Instructions

### Step 1: Create Report-URI Account

1. Go to https://report-uri.com/
2. Sign up for a free account
3. Create a new site: "aiborg-learn-sphere"
4. Copy your unique reporting endpoint

### Step 2: Update Vercel Configuration

The `vercel.json` file has been pre-configured with:

```json
{
  "key": "Reporting-Endpoints",
  "value": "csp-endpoint=\"https://aiborg.report-uri.com/r/d/csp/reportOnly\""
},
{
  "key": "Content-Security-Policy-Report-Only",
  "value": "... report-uri https://aiborg.report-uri.com/r/d/csp/reportOnly; report-to csp-endpoint;"
}
```

**Update the endpoint URL** with your actual report-uri.com endpoint.

### Step 3: Deploy to Vercel

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Build the project
npm run build

# Deploy to Vercel
npx vercel --prod --token ogferIl3xcqkP9yIUXzMezgH
```

### Step 4: Verify Reporting is Active

1. Visit your production site
2. Open browser DevTools → Console
3. Check for CSP warnings (if any)
4. Go to report-uri.com dashboard
5. Verify violations are being reported

---

## Report-Only vs Enforcement Mode

### Current Configuration: Report-Only Mode ✅

**Purpose:** Monitor violations without blocking content
**Header:** `Content-Security-Policy-Report-Only`
**Behavior:**
- ✅ Violations are reported to endpoint
- ✅ Content still loads (no blocking)
- ✅ User experience unaffected
- ✅ Safe for production deployment

**Use Case:** Initial deployment, testing, monitoring

### Future Configuration: Enforcement Mode

**Purpose:** Block violating content
**Header:** `Content-Security-Policy` (already present, but no reporting)
**Behavior:**
- ❌ Violations blocked (content doesn't load)
- ✅ Stricter security
- ⚠️ May break functionality if CSP is too restrictive

**Migration Path:**
1. Run Report-Only for 1-2 weeks
2. Analyze violations
3. Fix legitimate issues
4. Switch to Enforcement mode

---

## Monitoring CSP Violations

### report-uri.com Dashboard

**Access:** https://report-uri.com/account/reports/

**Key Metrics to Monitor:**

1. **Violation Count**
   - Spike indicates potential attack or legitimate issue
   - Baseline: Expect <10 violations/day normally

2. **Violated Directive**
   - `script-src`: Inline script or external script blocked
   - `style-src`: Inline style blocked
   - `img-src`: Image from unauthorized domain
   - `connect-src`: AJAX/fetch to unauthorized endpoint

3. **Blocked URI**
   - Identifies which resources are being blocked
   - Helps determine if violation is malicious or legitimate

4. **Source File**
   - Shows which page/component triggered violation
   - Aids in debugging legitimate issues

### Common Violation Patterns

#### 1. Browser Extensions
**Example:** `chrome-extension://...`
**Action:** Ignore (user's browser extension, not our code)
**Frequency:** Common

#### 2. Third-Party Scripts
**Example:** `https://cdn.example.com/tracker.js`
**Action:**
- If legitimate: Add to `script-src` whitelist
- If malicious: Investigate compromise
**Frequency:** Moderate

#### 3. Inline Scripts
**Example:** `inline script`
**Action:**
- Refactor to external `.js` file
- OR add nonce/hash to CSP
**Frequency:** Should be rare with Vite build

#### 4. `eval()` Usage
**Example:** `eval` in violation details
**Action:**
- Identify library using `eval()`
- Consider alternative library
- Document necessity if unavoidable
**Frequency:** Rare (but present due to `unsafe-eval`)

---

## Alert Configuration

### Recommended Alerts

**1. Violation Spike Alert**
- **Threshold:** >50 violations in 1 hour
- **Action:** Investigate potential attack or deployment issue
- **Priority:** HIGH

**2. New Blocked Domain**
- **Threshold:** First occurrence of new external domain
- **Action:** Review if domain should be whitelisted
- **Priority:** MEDIUM

**3. `javascript:` URL Violations**
- **Threshold:** Any occurrence
- **Action:** Investigate potential XSS attempt
- **Priority:** CRITICAL

### Setting Up Alerts

report-uri.com provides email alerts for:
- New violation types
- Violation spikes
- Specific blocked URIs

**Configuration:**
1. Go to Settings → Alerts
2. Enable email notifications
3. Set thresholds
4. Add team email addresses

---

## Integration with Existing Monitoring

### Sentry Integration (Optional)

If using Sentry for error tracking, you can integrate CSP reports:

```javascript
// In your Sentry initialization
Sentry.init({
  // ... other config
  beforeSend(event, hint) {
    // Forward CSP violations to Sentry
    if (event.exception?.values?.[0]?.value?.includes('CSP')) {
      event.level = 'warning';
      event.tags = { ...event.tags, security: 'csp-violation' };
    }
    return event;
  },
});
```

### Custom Logging (Optional)

For advanced use cases, create a custom CSP reporting endpoint:

```typescript
// supabase/functions/csp-report/index.ts
Deno.serve(async (req) => {
  const violation = await req.json();

  // Log to database
  await supabase.from('csp_violations').insert({
    blocked_uri: violation['csp-report']['blocked-uri'],
    violated_directive: violation['csp-report']['violated-directive'],
    source_file: violation['csp-report']['source-file'],
    user_agent: req.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
  });

  return new Response('OK', { status: 200 });
});
```

---

## Troubleshooting

### Issue: No Violations Reported

**Possible Causes:**
1. Reporting endpoint URL incorrect
2. CSP header not sent
3. Browser doesn't support CSP reporting

**Debugging Steps:**
```bash
# Check headers are sent
curl -I https://your-production-url.com | grep -i "content-security"

# Should see:
# Content-Security-Policy-Report-Only: ...
# Reporting-Endpoints: ...
```

### Issue: Too Many Violations

**Possible Causes:**
1. CSP too restrictive
2. Browser extension violations
3. Development code leaked to production

**Debugging Steps:**
1. Filter out browser extension violations
2. Group by `blocked-uri` to find patterns
3. Review legitimate vs. malicious violations

### Issue: False Positives

**Common False Positives:**
- Browser extensions (chrome-extension://, moz-extension://)
- Browser built-in features (about:blank, about:srcdoc)
- Link prefetching (data:, blob:)

**Action:** Add filters in report-uri.com to ignore these

---

## Maintenance Schedule

### Daily
- ✅ Check for violation spikes (automated alert)

### Weekly
- ✅ Review top 10 blocked URIs
- ✅ Investigate new violation types
- ✅ Update whitelist if legitimate violations found

### Monthly
- ✅ Analyze trends
- ✅ Clean up database (if using custom endpoint)
- ✅ Review and update CSP policy

### Quarterly
- ✅ Comprehensive CSP audit
- ✅ Consider tightening policy
- ✅ Test enforcement mode in staging

---

## Migration to Enforcement Mode

**Target Date:** After 2 weeks of Report-Only monitoring

### Pre-Migration Checklist

- [ ] No violations in past 7 days (excluding browser extensions)
- [ ] All legitimate violations resolved
- [ ] Staging environment tested with enforcement
- [ ] Rollback plan documented

### Migration Steps

1. **Week 1-2: Monitor Report-Only**
   - Collect baseline data
   - Fix legitimate violations

2. **Week 3: Staging Test**
   - Enable enforcement in staging
   - Test all features
   - Verify no broken functionality

3. **Week 4: Production Deployment**
   - Deploy enforcement mode
   - Monitor closely for 48 hours
   - Rollback if issues occur

4. **Post-Migration: Continuous Monitoring**
   - Weekly violation reviews
   - Update policy as needed

### Rollback Procedure

If enforcement mode causes issues:

```bash
# Revert to Report-Only
git revert <commit-hash>
npx vercel --prod --token ogferIl3xcqkP9yIUXzMezgH
```

---

## Current CSP Policy

### Enforced Policy (Active)
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.gstatic.com https://js.hcaptcha.com https://*.hcaptcha.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://hcaptcha.com https://*.hcaptcha.com;
img-src 'self' data: https: blob:;
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' https://afrulkxxzcmngbrdfuzj.supabase.co wss://afrulkxxzcmngbrdfuzj.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://api.stripe.com https://hcaptcha.com https://*.hcaptcha.com;
frame-src 'self' https://accounts.google.com https://js.stripe.com https://hcaptcha.com https://*.hcaptcha.com;
object-src 'none';
base-uri 'self';
form-action 'self' https://accounts.google.com;
frame-ancestors 'none';
block-all-mixed-content;
upgrade-insecure-requests;
```

### Report-Only Policy (Monitoring)
Same as enforced policy + reporting directives:
- `report-uri https://aiborg.report-uri.com/r/d/csp/reportOnly`
- `report-to csp-endpoint`

---

## Security Benefits

### Detection Capabilities

✅ **XSS Attempts**
- Detects `<script>` injection attempts
- Reports `javascript:` URL usage
- Identifies eval() exploits

✅ **Unauthorized Resource Loading**
- Flags external scripts not in whitelist
- Detects unauthorized iframes
- Reports unexpected API calls

✅ **Compromised Dependencies**
- Identifies malicious CDN resources
- Detects supply chain attacks
- Reports unexpected behaviors

### Response Time

- **Real-time Reporting:** Violations reported within seconds
- **Alert Latency:** Email alerts within 5 minutes
- **Dashboard Updates:** Every 1 minute

---

## Cost & Resources

### report-uri.com Pricing (as of 2025)

- **Free Tier:** 10,000 reports/month
- **Starter:** $9/month - 100,000 reports
- **Pro:** $29/month - 1M reports + advanced analytics
- **Enterprise:** Custom pricing

**Estimated Usage for aiborg-learn-sphere:**
- Expected: 1,000-5,000 reports/month (Free tier sufficient)
- Spike potential: 50,000 reports/month (if under attack)

**Recommendation:** Start with Free tier, upgrade if needed

---

## Best Practices

### 1. Regular Review
- Weekly violation analysis
- Monthly CSP policy updates
- Quarterly security audits

### 2. Team Communication
- Share CSP violation reports with team
- Document whitelisting decisions
- Maintain changelog for CSP updates

### 3. Documentation
- Keep this document updated
- Log all CSP policy changes
- Document incident responses

### 4. Testing
- Test new features against CSP
- Staging environment mirrors production CSP
- Pre-deployment CSP checks

---

## Additional Resources

### Documentation
- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [report-uri.com Docs](https://report-uri.com/help)

### Tools
- [CSP Generator](https://report-uri.com/home/generate)
- [CSP Analyzer](https://csp-evaluator.withgoogle.com/)
- [Observatory by Mozilla](https://observatory.mozilla.org/)

### Support
- Report-URI Support: support@report-uri.com
- Community: https://github.com/ScottHelme/report-uri

---

## Conclusion

CSP violation reporting is now configured in Report-Only mode, providing visibility into potential security issues without impacting user experience. Monitor the reports regularly and use the insights to strengthen the CSP policy over time.

**Next Steps:**
1. Create report-uri.com account
2. Update endpoint URL in `vercel.json`
3. Deploy to production
4. Monitor violations for 2 weeks
5. Migrate to enforcement mode

---

**Maintained By:** Security Team
**Last Updated:** November 13, 2025
**Next Review:** November 27, 2025
