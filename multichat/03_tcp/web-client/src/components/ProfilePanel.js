import defaultAvatar from '../assets/default-avatar.svg';
import editIcon from '../assets/edit-icon.svg';
import { deleteUser, logout } from '../services/restDelegate.js';

function ProfilePanel(username) {
    const panel = document.createElement('div');
    panel.className = 'profile-panel';

    const header = document.createElement('div');
    header.className = 'profile-panel-header';
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&larr;'; 
    closeBtn.onclick = () => {
        panel.classList.remove('visible');
    };
    const title = document.createElement('h3');
    title.innerText = 'Profile';
    header.appendChild(closeBtn);
    header.appendChild(title);
    panel.appendChild(header);

    const picSection = document.createElement('div');
    picSection.className = 'profile-pic-section';
    
    const profileImg = document.createElement('img');
    const savedImage = localStorage.getItem(`profile-image-${username}`);
    profileImg.src = savedImage || defaultAvatar;
    profileImg.alt = 'Profile Picture';
    profileImg.id = 'profile-img';
    
    const uploadOverlay = document.createElement('div');
    uploadOverlay.className = 'upload-overlay';
    uploadOverlay.innerHTML = '📷<br><span>Change Photo</span>';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target.result;
                
                profileImg.src = imageData;
                
                // Save to localStorage
                localStorage.setItem(`profile-image-${username}`, imageData);
                
                // Update sidebar avatar immediately
                const sidebarAvatar = document.querySelector('.profile-avatar');
                if (sidebarAvatar) {
                    sidebarAvatar.src = imageData;
                }
                
                setTimeout(() => {
                    const avatarCheck = document.querySelector('.profile-avatar');
                    if (avatarCheck && avatarCheck.src !== imageData) {
                        avatarCheck.src = imageData;
                    }
                }, 100);
            };
            reader.readAsDataURL(file);
        }
    };
    
    uploadOverlay.onclick = () => fileInput.click();
    
    picSection.appendChild(profileImg);
    picSection.appendChild(uploadOverlay);
    picSection.appendChild(fileInput);
    panel.appendChild(picSection);

    const nameSection = createEditableSection('Your Name', username, false, username);
    panel.appendChild(nameSection);

    const aboutSection = createEditableSection('About', 'Available', true, username);
    panel.appendChild(aboutSection);

    // Danger Zone Section for deleting own account
    const dangerSection = document.createElement('div');
    dangerSection.className = 'user-actions-section danger-zone';
    dangerSection.style.marginTop = '30px';
    
    const dangerTitle = document.createElement('label');
    dangerTitle.innerText = 'Danger Zone';
    dangerTitle.className = 'actions-title danger-title';
    dangerSection.appendChild(dangerTitle);
    
    // Delete My Account Button
    const deleteAccountBtn = document.createElement('button');
    deleteAccountBtn.className = 'clear-chat-btn danger';
    deleteAccountBtn.innerText = 'Delete My Account';
    deleteAccountBtn.onclick = async () => {
        const confirmed = confirm(
            `⚠️ DELETE YOUR ACCOUNT: ${username}?\n\n` +
            `This will PERMANENTLY:\n` +
            `• Remove your account from the system\n` +
            `• Delete all your messages\n` +
            `• Remove you from all groups\n` +
            `• Delete all your profile data\n\n` +
            `THIS CANNOT BE UNDONE!\n\n` +
            `Are you absolutely sure?`
        );

        if (confirmed) {
            // Double confirmation
            const doubleConfirm = confirm(
                `FINAL WARNING!\n\n` +
                `You are about to delete your account: ${username}\n\n` +
                `This action is IRREVERSIBLE.\n\n` +
                `Click OK to DELETE FOREVER or Cancel to keep your account.`
            );

            if (doubleConfirm) {
                try {
                    console.log('[DELETE ACCOUNT] Deleting own account:', username);
                    
                    // First logout
                    await logout(username);
                    
                    // Then delete account
                    const result = await deleteUser(username);
                    console.log('[DELETE ACCOUNT] Result:', result);
                    
                    if (result.success) {
                        // Clear all local storage for this user
                        localStorage.removeItem(`profile-image-${username}`);
                        localStorage.removeItem(`profile-your-name-${username}`);
                        localStorage.removeItem(`profile-about-${username}`);
                        sessionStorage.removeItem('username');
                        
                        alert(`Your account has been permanently deleted.\n\nYou will now be redirected to the login page.`);
                        
                        // Redirect to login page
                        window.location.href = '/';
                    } else {
                        console.error('[DELETE ACCOUNT] Failed:', result);
                        alert(`Error deleting account: ${result.message || 'Unknown error'}`);
                    }
                } catch (error) {
                    console.error('[DELETE ACCOUNT] Exception:', error);
                    alert(`Failed to delete account: ${error.message}. Please try again.`);
                }
            }
        }
    };
    
    dangerSection.appendChild(deleteAccountBtn);
    panel.appendChild(dangerSection);

    return panel;
}

function createEditableSection(label, initialValue, allowEdit, username) {
    const section = document.createElement('div');
    section.className = 'profile-info-section editable';

    const labelEl = document.createElement('label');
    labelEl.innerText = label;

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'editable-content';

    const valueEl = document.createElement('p');
    const storageKey = `profile-${label.toLowerCase().replace(' ', '-')}-${username}`;
    const savedValue = localStorage.getItem(storageKey);
    valueEl.innerText = savedValue || initialValue;

    if (allowEdit) {
        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.value = savedValue || initialValue;
        inputEl.style.display = 'none';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = `<img src="${editIcon}" alt="Edit">`;

        const startEditing = () => {
            valueEl.style.display = 'none';
            editBtn.style.display = 'none';
            inputEl.style.display = 'block';
            inputEl.focus();
        };

        const stopEditing = () => {
            const newValue = inputEl.value.trim();
            valueEl.innerText = newValue;
            const storageKey = `profile-${label.toLowerCase().replace(' ', '-')}-${username}`;
            localStorage.setItem(storageKey, newValue);

            valueEl.style.display = 'block';
            editBtn.style.display = 'block';
            inputEl.style.display = 'none';
        };

        valueEl.onclick = startEditing;
        editBtn.onclick = startEditing;
        inputEl.onblur = stopEditing;
        inputEl.onkeypress = (e) => {
            if (e.key === 'Enter') {
                stopEditing();
            }
        };

        const textWrapper = document.createElement('div');
        textWrapper.style.flex = '1';
        textWrapper.appendChild(valueEl);
        textWrapper.appendChild(inputEl);
        
        contentWrapper.appendChild(textWrapper);
        contentWrapper.appendChild(editBtn);
        
        section.appendChild(labelEl);
        section.appendChild(contentWrapper);
    } else {
        contentWrapper.appendChild(valueEl);
        section.appendChild(labelEl);
        section.appendChild(contentWrapper);
    }

    return section;
}

export default ProfilePanel;
