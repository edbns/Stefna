// src/app/bootstrap.ts
// Global bootstrap for the application
// NO_DB_MODE: Gate noisy endpoints
const NO_DB_MODE = import.meta.env.VITE_NO_DB_MODE === 'true';
if (NO_DB_MODE) {
    console.log('🚫 NO_DB_MODE: Silencing DB calls (onboarding, notifications, record-asset)');
    // Override fetch to block DB-related calls
    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
        const url = typeof input === 'string' ? input : input.toString();
        // Block DB-related endpoints
        if (url.includes('/.netlify/functions/') && (url.includes('get-notifications') ||
            url.includes('update-profile') ||
            url.includes('onboarding') ||
            url.includes('record-asset') ||
            url.includes('user-settings') ||
            url.includes('get-user-profile') ||
            url.includes('check-tier-promotion'))) {
            console.debug('NO_DB_MODE: blocking DB call to', url);
            return Promise.resolve(new Response(JSON.stringify({
                error: 'NO_DB_MODE: DB calls disabled',
                success: false,
                blocked: true
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
        // Allow all other calls
        return originalFetch.call(this, input, init);
    };
    // Also block any direct API calls that might slip through
    const originalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
        const xhr = new originalXMLHttpRequest();
        const originalOpen = xhr.open;
        xhr.open = function (method, url, ...args) {
            const urlStr = url.toString();
            if (urlStr.includes('/.netlify/functions/') && (urlStr.includes('get-notifications') ||
                urlStr.includes('update-profile') ||
                urlStr.includes('onboarding') ||
                urlStr.includes('record-asset'))) {
                console.debug('NO_DB_MODE: blocking XHR call to', urlStr);
                // Return a mock response
                setTimeout(() => {
                    xhr.readyState = 4;
                    xhr.status = 200;
                    xhr.responseText = JSON.stringify({
                        error: 'NO_DB_MODE: DB calls disabled',
                        success: false,
                        blocked: true
                    });
                    xhr.onreadystatechange?.call(xhr);
                }, 0);
                return;
            }
            return originalOpen.call(this, method, url, ...args);
        };
        return xhr;
    };
}
else {
    console.log('✅ DB_MODE: All endpoints enabled');
}
export {};
