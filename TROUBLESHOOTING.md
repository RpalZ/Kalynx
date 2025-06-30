# Troubleshooting Guide for Kalyx Hosted Site

## Common Issues and Solutions

### 1. Loading Screen Freeze After Login

**Symptoms:**
- App gets stuck on loading screen after successful login
- Browser console shows errors
- App becomes unresponsive

**Possible Causes:**
1. **API Timeout Issues** - Edge functions taking too long to respond
2. **Environment Variables** - Missing or incorrect Supabase configuration
3. **CORS Issues** - Domain not properly configured in Supabase
4. **Network Connectivity** - Slow or failed API calls
5. **Authentication State** - Session not properly established

**Solutions:**

#### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages when the loading occurs
4. Common errors to look for:
   - `Failed to fetch` - Network/CORS issues
   - `Unauthorized` - Authentication problems
   - `Timeout` - API response delays

#### Verify Environment Variables
1. Check that these are set in your hosting environment:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
2. Ensure URLs don't have trailing slashes
3. Verify keys are correct and active

#### Check Supabase Configuration
1. **Authentication Settings:**
   - Go to Supabase Dashboard → Authentication → Settings
   - Add your domain to "Site URL" and "Redirect URLs"
   - Example: `https://your-domain.com`

2. **Edge Functions:**
   - Verify all functions are deployed and working
   - Test functions individually in Supabase dashboard
   - Check function logs for errors

3. **Database Policies:**
   - Ensure RLS policies allow authenticated users to read their data
   - Test database queries in SQL editor

#### Network Tab Analysis
1. Open Developer Tools → Network tab
2. Reload the page and login
3. Look for failed requests (red status codes)
4. Check response times (should be under 10 seconds)
5. Verify CORS headers are present

### 2. Authentication Issues

**Symptoms:**
- Login appears successful but redirects to auth page
- "Unauthorized" errors in console
- Session not persisting

**Solutions:**

#### Clear Browser Data
1. Clear cookies and local storage for your domain
2. Try incognito/private browsing mode
3. Disable browser extensions temporarily

#### Check Supabase Auth Configuration
1. Verify email confirmation is disabled (for testing)
2. Check if user exists in Supabase Auth dashboard
3. Ensure auth policies are correctly configured

### 3. API Function Errors

**Symptoms:**
- Specific features not working (meals, workouts, etc.)
- 500 errors in network tab
- Functions timing out

**Solutions:**

#### Check Function Logs
1. Go to Supabase Dashboard → Edge Functions
2. Click on specific function
3. Check logs for errors
4. Look for timeout or memory issues

#### Test Functions Individually
1. Use Supabase dashboard to test functions
2. Verify input parameters are correct
3. Check function response format

### 4. Performance Issues

**Symptoms:**
- Slow loading times
- Laggy interactions
- High memory usage

**Solutions:**

#### Optimize API Calls
1. Implement proper caching
2. Reduce API call frequency
3. Use pagination for large datasets

#### Check Bundle Size
1. Analyze JavaScript bundle size
2. Remove unused dependencies
3. Implement code splitting

### 5. Mobile/Responsive Issues

**Symptoms:**
- Layout broken on mobile
- Touch interactions not working
- Viewport issues

**Solutions:**

#### Test on Different Devices
1. Use browser dev tools device simulation
2. Test on actual mobile devices
3. Check different screen sizes

#### Verify Responsive Design
1. Check CSS media queries
2. Ensure touch targets are large enough
3. Test scroll behavior

## Debugging Steps

### Step 1: Basic Checks
1. ✅ Check browser console for errors
2. ✅ Verify internet connection
3. ✅ Try different browser/device
4. ✅ Clear browser cache and cookies

### Step 2: Environment Verification
1. ✅ Confirm environment variables are set
2. ✅ Test Supabase connection manually
3. ✅ Verify domain configuration
4. ✅ Check CORS settings

### Step 3: API Testing
1. ✅ Test edge functions individually
2. ✅ Check database connectivity
3. ✅ Verify authentication flow
4. ✅ Monitor API response times

### Step 4: Advanced Debugging
1. ✅ Enable verbose logging
2. ✅ Use network monitoring tools
3. ✅ Check server-side logs
4. ✅ Analyze performance metrics

## Quick Fixes

### For Immediate Relief:
1. **Hard Refresh:** Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Clear Storage:** Developer Tools → Application → Clear Storage
3. **Incognito Mode:** Test in private browsing
4. **Different Browser:** Try Chrome, Firefox, Safari

### For Persistent Issues:
1. **Check Supabase Status:** Visit status.supabase.com
2. **Verify Domain DNS:** Use DNS checker tools
3. **Test API Endpoints:** Use Postman or curl
4. **Contact Support:** If all else fails

## Error Codes Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 401 | Unauthorized | Check authentication, verify tokens |
| 403 | Forbidden | Check RLS policies, user permissions |
| 404 | Not Found | Verify API endpoints, check routing |
| 500 | Server Error | Check edge function logs, database issues |
| 502 | Bad Gateway | Temporary server issue, try again later |
| 503 | Service Unavailable | Check Supabase status page |
| 504 | Gateway Timeout | API taking too long, check function performance |

## Prevention Tips

1. **Monitor Performance:** Set up alerts for slow API responses
2. **Regular Testing:** Test critical flows frequently
3. **Error Tracking:** Implement error monitoring (Sentry, etc.)
4. **Backup Plans:** Have fallback data for offline scenarios
5. **Documentation:** Keep deployment and configuration documented

## Getting Help

If you're still experiencing issues:

1. **Check Console Logs:** Copy any error messages
2. **Document Steps:** Note exactly what you were doing when the issue occurred
3. **Environment Details:** Include browser, device, and network information
4. **Screenshots:** Capture error states and console output

The updated code includes comprehensive error handling, timeouts, and fallback states to prevent the loading screen freeze issue.