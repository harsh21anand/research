class AuthHandler {
    static async login(email, password) {
        try {
            FormValidator.validateEmail(email);
            FormValidator.validatePassword(password);

            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const token = await userCredential.user.getIdToken();
            localStorage.setItem('authToken', token);
            
            return { success: true, message: 'Login successful' };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    static async register(email, password, fullName) {
        try {
            FormValidator.validateEmail(email);
            FormValidator.validatePassword(password);
            FormValidator.validateName(fullName);

            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update profile
            await user.updateProfile({ displayName: fullName });

            // Store in Firestore
            await db.collection('users').doc(user.uid).set({
                fullName,
                email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, message: 'Registration successful' };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    static async socialLogin(provider) {
        try {
            let authProvider;
            switch(provider) {
                case 'google':
                    authProvider = new firebase.auth.GoogleAuthProvider();
                    break;
                case 'facebook':
                    authProvider = new firebase.auth.FacebookAuthProvider();
                    break;
                default:
                    throw new Error('Invalid provider');
            }

            const result = await auth.signInWithPopup(authProvider);
            const token = await result.user.getIdToken();
            localStorage.setItem('authToken', token);

            return { success: true, message: 'Social login successful' };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    static async resetPassword(email) {
        try {
            FormValidator.validateEmail(email);
            await auth.sendPasswordResetEmail(email);
            return { success: true, message: 'Password reset email sent' };
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

// Form validation utility
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
};

// Handle Registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
        validateForm(formData);
        const response = await fetch('auth/register.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            showSuccess('Registration successful! Please login.');
            setTimeout(() => {
                document.querySelector('[onclick="toggleForm(\'login\')"]').click();
            }, 2000);
        } else {
            showError(data.message || 'Registration failed');
        }
    } catch (error) {
        showError(error.message);
    }
});

// Handle Login
// Add to login form handler
// Login attempt counter
let loginAttempts = {};
const MAX_ATTEMPTS = 3;

// Login handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    // Check login attempts
    if (loginAttempts[email] >= MAX_ATTEMPTS) {
        showError('Too many failed attempts. Please reset your password.');
        showForgotPasswordForm();
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        // Reset attempts on successful login
        loginAttempts[email] = 0;
        showSuccess('Login successful!');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
    } catch (error) {
        // Increment failed attempts
        loginAttempts[email] = (loginAttempts[email] || 0) + 1;
        const remainingAttempts = MAX_ATTEMPTS - loginAttempts[email];
        
        if (remainingAttempts > 0) {
            showError(`Invalid credentials. ${remainingAttempts} attempts remaining.`);
        } else {
            showError('Too many failed attempts. Please reset your password.');
            showForgotPasswordForm();
        }
    }
});

// Register handler
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const fullname = e.target.fullname.value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({
            displayName: fullname
        });

        // Store additional user data in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            fullname: fullname,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showSuccess('Registration successful!');
        setTimeout(() => toggleForm('login'), 1500);
    } catch (error) {
        showError(error.message);
    }
});

// Password reset handler
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;

    try {
        await auth.sendPasswordResetEmail(email);
        showSuccess('Password reset link sent to your email');
        setTimeout(() => toggleForm('login'), 1500);
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
        }

        const result = await auth.signInWithPopup(authProvider);
        showSuccess('Login successful!');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
    } catch (error) {
        showError(error.message);
    }
}

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        if (window.location.pathname.includes('auth.html')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is signed out
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'auth.html';
        }
    }
});

function showForgotPasswordForm() {
    // Hide login form
    document.querySelector('.form.active').classList.remove('active');
    
    // Show forgot password form
    const resetForm = document.getElementById('resetPasswordForm');
    resetForm.classList.add('active');
}

// Message display functions
function showError(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message error-message';
    messageDiv.textContent = message;
    
    const activeForm = document.querySelector('.form.active');
    activeForm.insertBefore(messageDiv, activeForm.firstChild);
    
    setTimeout(() => messageDiv.remove(), 3000);
}

function showSuccess(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message success-message';
    messageDiv.textContent = message;
    
    const activeForm = document.querySelector('.form.active');
    activeForm.insertBefore(messageDiv, activeForm.firstChild);
    
    setTimeout(() => messageDiv.remove(), 3000);
}