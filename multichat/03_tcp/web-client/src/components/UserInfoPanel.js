import defaultAvatar from '../assets/default-avatar.svg';
import { clearChatHistory, deleteUser } from '../services/restDelegate.js';

function UserInfoPanel(username) {
    const panel = document.createElement('div');
    panel.className = 'user-info-panel';

    const header = document.createElement('div');
    header.className = 'profile-panel-header';
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.fontSize = '28px';
    closeBtn.onclick = () => {
        panel.classList.remove('visible');
    };
    const title = document.createElement('h3');
    title.innerText = 'Contact Info';
    header.appendChild(closeBtn);
    header.appendChild(title);
    panel.appendChild(header);

   
    const picSection = document.createElement('div');
    picSection.className = 'profile-pic-section';
    
    const profileImg = document.createElement('img');
    const savedImage = localStorage.getItem(`profile-image-${username}`);
    profileImg.src = savedImage || defaultAvatar;
    profileImg.alt = 'Profile Picture';
    profileImg.style.cursor = 'default';
    
    picSection.appendChild(profileImg);
    panel.appendChild(picSection);

    const nameSection = document.createElement('div');
    nameSection.className = 'profile-info-section';
    
    const nameLabel = document.createElement('label');
    nameLabel.innerText = 'Name';
    
    const nameValue = document.createElement('p');
    const savedName = localStorage.getItem(`profile-your-name-${username}`);
    nameValue.innerText = savedName || username;
    
    nameSection.appendChild(nameLabel);
    nameSection.appendChild(nameValue);
    panel.appendChild(nameSection);

    const aboutSection = document.createElement('div');
    aboutSection.className = 'profile-info-section';
    
    const aboutLabel = document.createElement('label');
    aboutLabel.innerText = 'About';
    
    const aboutValue = document.createElement('p');
    const savedAbout = localStorage.getItem(`profile-about-${username}`);
    aboutValue.innerText = savedAbout || 'Available';
    
    aboutSection.appendChild(aboutLabel);
    aboutSection.appendChild(aboutValue);
    panel.appendChild(aboutSection);

    const actionsSection = document.createElement('div');
    actionsSection.className = 'user-actions-section';
    
    const actionsTitle = document.createElement('label');
    actionsTitle.innerText = 'Clear Chat History';
    actionsTitle.className = 'actions-title';
    actionsSection.appendChild(actionsTitle);

    const clearForMeBtn = document.createElement('button');
    clearForMeBtn.className = 'clear-chat-btn';
    clearForMeBtn.innerText = 'Clear for Me';
    clearForMeBtn.onclick = () => {
        if (confirm(`Clear all messages with ${username} for you only?\n\nThis will delete the chat history from your device, but ${username} will still see the messages.`)) {
            const chatKey = `user_${username}`;

            if (window.messageCache && window.messageCache[chatKey]) {
                delete window.messageCache[chatKey];
            }
            
            const messagesArea = document.getElementById('chat-messages');
            if (messagesArea) {
                messagesArea.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Chat history cleared</p>';
            }
            
            panel.classList.remove('visible');
        }
    };
    
    const clearForEveryoneBtn = document.createElement('button');
    clearForEveryoneBtn.className = 'clear-chat-btn danger';
    clearForEveryoneBtn.innerText = 'Clear for Everyone';
    clearForEveryoneBtn.onclick = async () => {
        if (confirm(`Clear all messages with ${username} for EVERYONE?\n\nThis will delete the chat history for both you and ${username}. This action cannot be undone.`)) {
            const currentUser = sessionStorage.getItem('username');
            if (!currentUser) {
                alert('Error: No user logged in');
                return;
            }

            try {
                const result = await clearChatHistory(currentUser, username);
                
                if (result.status === 'OK') {
                    const chatKey = `user_${username}`;
                    
                    if (window.messageCache && window.messageCache[chatKey]) {
                        delete window.messageCache[chatKey];
                    }
                    
                    const messagesArea = document.getElementById('chat-messages');
                    if (messagesArea) {
                        messagesArea.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Chat history cleared for everyone</p>';
                    }
                    
                    panel.classList.remove('visible');
                } else {
                    alert(`Error clearing chat: ${result.message || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Error clearing chat history:', error);
                alert('Failed to clear chat history. Please try again.');
            }
        }
    };
    
    actionsSection.appendChild(clearForMeBtn);
    actionsSection.appendChild(clearForEveryoneBtn);
    panel.appendChild(actionsSection);

    const dangerSection = document.createElement('div');
    dangerSection.className = 'user-actions-section danger-zone';
    
    const dangerTitle = document.createElement('label');
    dangerTitle.innerText = 'Danger Zone';
    dangerTitle.className = 'actions-title danger-title';
    dangerSection.appendChild(dangerTitle);
    
    const deleteUserBtn = document.createElement('button');
    deleteUserBtn.className = 'clear-chat-btn danger';
    deleteUserBtn.innerText = 'Delete User Permanently';
    deleteUserBtn.onclick = async () => {
        const currentUser = sessionStorage.getItem('username');
        if (!currentUser) {
            alert('Error: No user logged in');
            return;
        }

        if (currentUser === username) {
            alert('You cannot delete your own account from here. Please use Profile Settings.');
            return;
        }

        const confirmed = confirm(
            ` DELETE USER: ${username}?\n\n` +
            `This will PERMANENTLY:\n` +
            `• Remove ${username} from the system\n` +
            `• Delete all their messages\n` +
            `• Remove them from all groups\n` +
            `• Delete their profile data\n\n` +
            `THIS CANNOT BE UNDONE!\n\n` +
            `Are you absolutely sure?`
        );

        if (confirmed) {
            const doubleConfirm = confirm(
                `FINAL CONFIRMATION\n\n` +
                `Type the username to confirm: ${username}\n\n` +
                `Click OK to DELETE or Cancel to abort.`
            );

            if (doubleConfirm) {
                try {
                    console.log('[DELETE USER] Calling deleteUser for:', username);
                    const result = await deleteUser(username);
                    console.log('[DELETE USER] Result:', result);
                    
                    if (result.success) {
                        alert(`User ${username} has been permanently deleted.`);
                        
                        const chatKey = `user_${username}`;
                        if (window.messageCache && window.messageCache[chatKey]) {
                            delete window.messageCache[chatKey];
                        }
                        
                        panel.classList.remove('visible');
                        
                        window.location.reload();
                    } else {
                        console.error('[DELETE USER] Failed:', result);
                        alert(`Error deleting user: ${result.message || 'Unknown error'}`);
                    }
                } catch (error) {
                    console.error('[DELETE USER] Exception:', error);
                    alert(`Failed to delete user: ${error.message}. Please try again.`);
                }
            }
        }
    };
    
    dangerSection.appendChild(deleteUserBtn);
    panel.appendChild(dangerSection);

    return panel;
}

export default UserInfoPanel;
