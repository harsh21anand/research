class UIHandler {
    static showMessage(message, type = 'error') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = message;
        
        const form = document.querySelector('.form.active');
        form.insertBefore(messageDiv, form.firstChild);
        
        setTimeout(() => messageDiv.remove(), 3000);
    }

    static toggleLoadingState(form, isLoading) {
        const button = form.querySelector('button[type="submit"]');
        button.disabled = isLoading;
        button.textContent = isLoading ? 'Please wait...' : button.dataset.originalText;
    }
}