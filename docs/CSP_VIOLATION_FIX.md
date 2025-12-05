# Content Security Policy (CSP) Violation Fix

## Issue
The application was experiencing a Content Security Policy violation error:

```
Loading the script 'http://localhost:3000/auth/login?onload=__iframefcb333554' violates the following Content Security Policy directive: "script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' chrome-extension://b51629db-88db-452d-81ef-bb3a95230e8b/". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback. The action has been blocked.
```

## Root Cause
The error was caused by Supabase Auth's `detectSessionInUrl` option being set to `true`. This option attempts to detect authentication sessions by creating iframes, which violates the Content Security Policy.

## Solution
Changed the Supabase client configuration in `lib/supabase/client.ts` to disable iframe-based session detection:

```typescript
auth: {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: false, // Disable to prevent CSP violations from iframe usage
  storageKey: 'sb-qelloucyeengtsfnsvcd-auth-token',
}
```

## Impact
- **No functionality loss**: The application uses email/password authentication, which doesn't require URL-based session detection
- **Improved security**: Eliminates CSP violations and potential security risks from iframe usage
- **Session persistence**: User sessions are still persisted via localStorage (controlled by `persistSession: true`)
- **Auto-refresh**: Token auto-refresh continues to work normally (controlled by `autoRefreshToken: true`)

## Testing
After applying this fix:
1. Clear browser cache and local storage
2. Navigate to the login page at `/auth/login`
3. Check browser console - the CSP violation error should no longer appear
4. Test login functionality - users should be able to log in successfully
5. Verify session persistence - users should remain logged in after page refresh

## Notes
- The `detectSessionInUrl` option is primarily used for OAuth flows and magic link authentication
- Since this application uses email/password authentication, disabling this option has no negative impact
- Sessions are still properly managed through localStorage and cookies
