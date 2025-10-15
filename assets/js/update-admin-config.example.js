// Copy this file to update-admin-config.js and set a passphrase hash.
// To generate the SHA-256 (hex) of your passphrase, open devtools and run:
// (async t=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))).map(b=>b.toString(16).padStart(2,'0')).join(''))('your-passphrase')
// Then set window.UPDATES_ADMIN_HASH = 'sha256:<your-hex-hash>'

// Example (replace with your own):
// window.UPDATES_ADMIN_HASH = 'sha256:0123456789abcdef...';

