/* clipboard.js
 *
 * Clipboard write helper with navigator.clipboard API
 * and execCommand fallback for non-secure contexts.
 *
 * Reused from ext-FF_Tab-to-OMD-paste.
 */

function copyToClipboard(text, onSuccess, onError) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess, onError);
        return;
    }
    /* execCommand fallback */
    try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) { onSuccess(); } else { onError(new Error('execCommand failed')); }
    } catch (e) {
        onError(e);
    }
}
