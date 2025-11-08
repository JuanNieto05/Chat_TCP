function Login() {
    const container = document.createElement('div');
    container.className = 'login-container';

    // Logo Section
    const logoSection = document.createElement('div');
    logoSection.className = 'login-logo-section';
    
    // WhatsApp-style logo (green circle with phone icon)
    const logoCircle = document.createElement('div');
    logoCircle.className = 'login-logo-circle';
    logoCircle.innerHTML = `
        <svg viewBox="0 0 24 24" class="login-phone-icon">
            <path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
    `;
    logoSection.appendChild(logoCircle);
    
    // Title next to logo
    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'login-title-wrapper';
    
    const title = document.createElement('h1');
    title.className = 'login-title';
    title.innerHTML = 'CHAT<br>TCP';
    
    titleWrapper.appendChild(title);
    logoSection.appendChild(titleWrapper);
    
    container.appendChild(logoSection);

    const form = document.createElement('div');
    form.className = 'login-form';

    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.placeholder = 'Enter your username';
    usernameInput.id = 'username-input';
    form.appendChild(usernameInput);

    const loginButton = document.createElement('button');
    loginButton.innerText = 'Join Chat';
    loginButton.onclick = async () => {
        const username = usernameInput.value.trim();
        if (username) {
            sessionStorage.setItem('username', username);
            window.location.href = '/chat';
        } else {
            alert('Please enter a username');
        }
    };
    form.appendChild(loginButton);

    container.appendChild(form);

    return container;
}

export default Login;
