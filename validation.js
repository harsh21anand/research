const FormValidator = {
    validateEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            throw new Error('Please enter a valid email address');
        }
    },

    validatePassword: (password) => {
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
    },

    validateName: (name) => {
        if (!name || name.trim().length < 2) {
            throw new Error('Please enter a valid name');
        }
    }
};