$(document).ready(function() {
    const showMessage = (message, isError = false) => {
        $('#message').text(message).removeClass('success error').addClass(isError ? 'error' : 'success');
    };

    $('#registerForm').on('submit', async function(e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }
            
            showMessage('Registration successful! Redirecting to login...');
            setTimeout(() => { window.location.href = '/index.html'; }, 2000);

        } catch (err) {
            showMessage(err.message, true);
        }
    });

    $('#loginForm').on('submit', async function(e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }
            sessionStorage.setItem('loggedInUser', result.username);
            window.location.href = '/dashboard.html';

        } catch (err) {
            showMessage(err.message, true);
        }
    });
    
    if (user) {
        sessionStorage.setItem('loggedInUser', username);
        window.location.href = 'dashboard.html';
    } else {
        window.location.href = '/index.html';
    }
    
    
    $('#logoutBtn').on('click', function() {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = '/index.html';
    });
});