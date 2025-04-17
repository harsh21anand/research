document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    formData.append('action', 'login');

    fetch('auth/auth_handler.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            window.location.href = 'dashboard.php';
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        showError('An error occurred. Please try again.');
    });
});

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    formData.append('action', 'register');

    fetch('auth/auth_handler.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showSuccess(data.message);
            setTimeout(() => {
                toggleForm('login');
            }, 2000);
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        showError('An error occurred. Please try again.');
    });
});

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    // Add to form
    const activeForm = document.querySelector('.form.active');
    activeForm.insertBefore(errorDiv, activeForm.firstChild);
    setTimeout(() => errorDiv.remove(), 3000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    // Add to form
    const activeForm = document.querySelector('.form.active');
    activeForm.insertBefore(successDiv, activeForm.firstChild);
    setTimeout(() => successDiv.remove(), 3000);
}

// Add to existing auth.js

// Form validation
const validateForm = (formData) => {
    const email = formData.get('email');
    const password = formData.get('password');
    
    if (!email || !password) {
        throw new Error('All fields are required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }
    
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }
    
    return true;
};

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);

    try {
        validateForm(formData);
        
        const email = formData.get('email');
        const password = formData.get('password');
        
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get JWT token
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
        
        showSuccess('Login successful');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } catch (error) {
        showError(error.message);
    }
});

// Register form handler
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);

    try {
        validateForm(formData);
        
        const email = formData.get('email');
        const password = formData.get('password');
        const fullName = formData.get('fullname');
        
        // Create user in Firebase
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile
        await user.updateProfile({
            displayName: fullName
        });
        
        // Store additional user data in Firestore
        await firebase.firestore().collection('users').doc(user.uid).set({
            fullName: fullName,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showSuccess('Registration successful');
        setTimeout(() => {
            toggleForm('login');
        }, 1500);
    } catch (error) {
        showError(error.message);
    }
});

// Social login handlers
async function handleSocialLogin(provider) {
    try {
        let authProvider;
        switch(provider) {
            case 'google':
                authProvider = new firebase.auth.GoogleAuthProvider();
                break;
            case 'facebook':
                authProvider = new firebase.auth.FacebookAuthProvider();
                break;
            case 'twitter':
                authProvider = new firebase.auth.TwitterAuthProvider();
                break;
        }
        
        const result = await firebase.auth().signInWithPopup(authProvider);
        const user = result.user;
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError(error.message);
    }
}

// Auth state observer
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        user.getIdToken().then(token => {
            localStorage.setItem('authToken', token);
        });
    } else {
        // User is signed out
        localStorage.removeItem('authToken');
    }
});

// Password reset handler
async function requestPasswordReset() {
    const email = document.querySelector('#resetEmail').value;
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        showSuccess('Password reset link sent to your email');
    } catch (error) {
        showError(error.message);
    }
}

// Error and success message handlers remain the same

function handleSocialLogin(provider) {
    window.location.href = `auth/social_login.php?provider=${provider}`;
}

// Add remember me checkbox handler
document.querySelector('#rememberMe').addEventListener('change', function() {
    localStorage.setItem('rememberMe', this.checked);
});

// Event Listeners
// Add this at the beginning of your auth.js file
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log('Persistence set to LOCAL');
    })
    .catch((error) => {
        console.error('Persistence error:', error);
    });

// Update the login handler to include persistence
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    UIHandler.toggleLoadingState(form, true);

    try {
        const email = form.querySelector('[type="email"]').value;
        const password = form.querySelector('[type="password"]').value;
        const rememberMe = form.querySelector('#rememberMe')?.checked;
        
        // Set persistence based on remember me
        await firebase.auth().setPersistence(
            rememberMe 
                ? firebase.auth.Auth.Persistence.LOCAL 
                : firebase.auth.Auth.Persistence.SESSION
        );
        
        const result = await AuthHandler.login(email, password);
        UIHandler.showMessage(result.message, 'success');
        setTimeout(() => window.location.href = '/dashboard.html', 1500);
    } catch (error) {
        UIHandler.showMessage(error.message);
    } finally {
        UIHandler.toggleLoadingState(form, false);
    }
});

// Add session check function
function checkAuthState() {
    firebase.auth().onAuthStateChanged((user) => {
        const protectedPages = ['/dashboard.html', '/profile.html', '/settings.html'];
        const currentPath = window.location.pathname;
        
        if (!user && protectedPages.includes(currentPath)) {
            window.location.href = '/auth.html';
        } else if (user && currentPath === '/auth.html') {
            window.location.href = '/dashboard.html';
        }
    });
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', checkAuthState);
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    UIHandler.toggleLoadingState(form, true);

    try {
        const email = form.querySelector('[type="email"]').value;
        const password = form.querySelector('[type="password"]').value;
        const fullName = form.querySelector('[name="fullName"]').value;
        
        const result = await AuthHandler.register(email, password, fullName);
        UIHandler.showMessage(result.message, 'success');
        setTimeout(() => toggleForm('login'), 1500);
    } catch (error) {
        UIHandler.showMessage(error.message);
    } finally {
        UIHandler.toggleLoadingState(form, false);
    }
});

// Social Login Handlers
document.querySelectorAll('.social-btn').forEach(button => {
    button.addEventListener('click', async () => {
        try {
            const provider = button.dataset.provider;
            const result = await AuthHandler.socialLogin(provider);
            UIHandler.showMessage(result.message, 'success');
            setTimeout(() => window.location.href = '/dashboard.html', 1500);
        } catch (error) {
            UIHandler.showMessage(error.message);
        }
    });
});

// Password Reset Handler
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    UIHandler.toggleLoadingState(form, true);

    try {
        const email = form.querySelector('[type="email"]').value;
        const result = await AuthHandler.resetPassword(email);
        UIHandler.showMessage(result.message, 'success');
    } catch (error) {
        UIHandler.showMessage(error.message);
    } finally {
        UIHandler.toggleLoadingState(form, false);
    }
});