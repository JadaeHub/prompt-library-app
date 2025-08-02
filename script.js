// script.js
document.addEventListener('DOMContentLoaded', () => {

    // #################### CONFIGURATION - PASTE YOUR KEYS HERE ####################
    const supabaseUrl = 'https://tmsjjysxrhddfdbhzgaa.supabase.co/functions/v1/oauth-callback';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtc2pqeXN4cmhkZGZkYmh6Z2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDM0MjQsImV4cCI6MjA2OTcxOTQyNH0.kHyAFzYUlxjeBpFz_H0IrkwQ5RPvsCh0gesp9n6H1uY';
    const googleClientId = '350643972369-qcocd9g3r16vbjskp05nsfuius465pci.apps.googleusercontent.com';
    const redirectTargetUrl = 'admin.html';
    // ############################################################################

    const { createClient } = window.supabase;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const simpleLoginBtn = document.getElementById('simple-login-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const simpleLoginForm = document.getElementById('simple-login-form');
    const errorMessageDiv = document.getElementById('error-message');

    simpleLoginBtn.addEventListener('click', () => {
        simpleLoginForm.classList.toggle('hidden');
        if (!simpleLoginForm.innerHTML) {
            simpleLoginForm.innerHTML = `<input type="text" id="username" placeholder="Username" required><input type="password" id="password" placeholder="Password" required><button type="submit">Login</button>`;
        }
        errorMessageDiv.classList.add('hidden');
    });

    simpleLoginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const usernameInput = document.getElementById('username').value;
        const passwordInput = document.getElementById('password').value;
        try {
            const { data, error } = await supabase.from('admins').select('username').eq('username', usernameInput).eq('password', passwordInput).single();
            if (error) throw error;
            if (data) window.location.href = redirectTargetUrl;
            else showError('Invalid username or password.');
        } catch (error) {
            showError('Invalid username or password.');
        }
    });

    googleLoginBtn.addEventListener('click', () => {
        const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;
        const scope = 'https://www.googleapis.com/auth/userinfo.email';
        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline&prompt=consent`;
        window.location.href = oauthUrl;
    });

    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.remove('hidden');
    }
});```

#### **File 5: `admin.html` (Success Page)**
```html
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Admin Dashboard</title><link rel="stylesheet" href="main.css"></head><body style="padding: 2rem; text-align: center;"><h1 style="color: #28a745;">Access Granted</h1><p>Welcome to the secure admin area.</p></body></html>