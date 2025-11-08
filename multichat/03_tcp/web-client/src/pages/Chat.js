import { navigateTo } from '../router/Router.js';
import { 
    login,
    getOnlineUsers,
    getAllUsers,
    sendMessageToUser, 
    sendMessageToGroup,
    createGroup,
    addMemberToGroup,
    getUserGroups,
    getHistory,
    getPendingMessages
} from '../services/restDelegate.js';
import ProfilePanel from '../components/ProfilePanel.js';
import UserInfoPanel from '../components/UserInfoPanel.js';

function Chat() {
    const username = sessionStorage.getItem('username');
    
    if (!username) {
        window.location.href = '/';
        return document.createElement('div');
    }

    const container = document.createElement('div');
    container.className = 'chat-container';

    // Panel de perfil propio
    const profilePanel = ProfilePanel(username);
    container.appendChild(profilePanel);

    // Panel de información del usuario (se crea dinámicamente)
    let userInfoPanel = null;

    const sidebar = createSidebar(username, () => {
        profilePanel.classList.add('visible');
    });
    container.appendChild(sidebar);

    const chatArea = createChatArea(() => {
        // Callback para abrir el panel de información del usuario
        if (currentChat && currentChat.type === 'user') {
            // Remover panel anterior si existe
            if (userInfoPanel) {
                container.removeChild(userInfoPanel);
            }
            // Crear nuevo panel con el usuario actual
            userInfoPanel = UserInfoPanel(currentChat.name);
            container.appendChild(userInfoPanel);
            userInfoPanel.classList.add('visible');
        }
    });
    container.appendChild(chatArea);

    initializeChat(username);

    return container;
}

import defaultAvatar from '../assets/default-avatar.svg';

function createSidebar(username, onProfileClick) {
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';

    const header = document.createElement('div');
    header.className = 'sidebar-header';
    
    const profileImg = document.createElement('img');
    const savedImage = localStorage.getItem(`profile-image-${username}`);
    profileImg.src = savedImage || defaultAvatar;
    profileImg.alt = "Profile";
    profileImg.className = 'profile-avatar';
    profileImg.onclick = onProfileClick; 
    header.appendChild(profileImg);

    const userTitle = document.createElement('h2');
    userTitle.innerText = username;
    header.appendChild(userTitle);
    
    sidebar.appendChild(header);

    const tabs = document.createElement('div');
    tabs.className = 'sidebar-tabs';
    
    const usersTab = document.createElement('button');
    usersTab.innerText = 'Users';
    usersTab.className = 'active';
    usersTab.onclick = () => {
        usersTab.classList.add('active');
        groupsTab.classList.remove('active');
        showUsers();
    };
    
    const groupsTab = document.createElement('button');
    groupsTab.innerText = 'Groups';
    groupsTab.onclick = () => {
        groupsTab.classList.add('active');
        usersTab.classList.remove('active');
        showGroups();
    };
    
    tabs.appendChild(usersTab);
    tabs.appendChild(groupsTab);
    sidebar.appendChild(tabs);

    // Content
    const content = document.createElement('div');
    content.className = 'sidebar-content';
    content.id = 'sidebar-content';
    sidebar.appendChild(content);

    return sidebar;
}

function createChatArea(onHeaderClick) {
    const chatArea = document.createElement('div');
    chatArea.className = 'chat-area';

    // Header
    const header = document.createElement('div');
    header.className = 'chat-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.gap = '15px';
    
    // Header left side (avatar + title) - Clickeable para ver info del usuario
    const headerLeft = document.createElement('div');
    headerLeft.style.display = 'flex';
    headerLeft.style.alignItems = 'center';
    headerLeft.style.gap = '15px';
    headerLeft.style.flex = '1';
    headerLeft.style.cursor = 'pointer';
    headerLeft.id = 'chat-header-left';
    headerLeft.onclick = () => {
        if (onHeaderClick) {
            onHeaderClick();
        }
    };
    
    const chatAvatar = document.createElement('img');
    chatAvatar.id = 'chat-avatar';
    chatAvatar.style.cssText = 'width: 40px; height: 40px; border-radius: 50%; object-fit: cover; display: none;';
    chatAvatar.alt = 'Chat Avatar';
    headerLeft.appendChild(chatAvatar);
    
    const title = document.createElement('h3');
    title.id = 'chat-title';
    title.innerText = 'Select a conversation';
    headerLeft.appendChild(title);
    
    header.appendChild(headerLeft);
    
    const groupSettingsBtn = document.createElement('button');
    groupSettingsBtn.id = 'group-settings-btn';
    groupSettingsBtn.innerText = '⚙️';
    groupSettingsBtn.style.cssText = 'display: none; background: transparent; border: none; font-size: 24px; cursor: pointer; padding: 5px 15px; opacity: 0.7; transition: opacity 0.2s;';
    groupSettingsBtn.onmouseover = () => groupSettingsBtn.style.opacity = '1';
    groupSettingsBtn.onmouseout = () => groupSettingsBtn.style.opacity = '0.7';
    groupSettingsBtn.onclick = () => showGroupSettings();
    header.appendChild(groupSettingsBtn);
    
    chatArea.appendChild(header);

    const messages = document.createElement('div');
    messages.className = 'chat-messages';
    messages.id = 'chat-messages';
    chatArea.appendChild(messages);

    const inputArea = document.createElement('div');
    inputArea.className = 'chat-input';
    inputArea.id = 'chat-input-area';
    inputArea.style.display = 'none'; 
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type a message...';
    input.id = 'message-input';
    input.onkeypress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };
    
    const sendBtn = document.createElement('button');
    sendBtn.innerText = 'Send';
    sendBtn.onclick = sendMessage;
    
    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);
    chatArea.appendChild(inputArea);

    return chatArea;
}

async function initializeChat(username) {
    try {
        // Login via REST API
        const loginResult = await login(username);
        console.log('Login result:', loginResult);
        
        if (!loginResult.success) {
            alert('Error al conectar: ' + loginResult.message);
            return;
        }
        
        // Load users
        await showUsers();
        
        // Start polling for messages every 2 seconds
        startMessagePolling(username);
        
        // Load message history from server
        await loadMessageHistory(username);
    } catch (error) {
        console.error('Error initializing chat:', error);
        alert('Failed to connect to chat server');
    }
}

async function loadMessageHistory(username) {
    try {
        const result = await getHistory(username);
        
        if (result.success && result.history) {
            console.log('[DEBUG] Loading history, total entries:', result.history.length);
            
            // Procesar mensajes históricos
            result.history.forEach(entry => {
                try {
                    // Parsear el registro (formato: {type:text,from:X,target:Y,isGroup:false,msg:...,ts:...})
                    const from = entry.match(/from:([^,]+)/)?.[1];
                    const target = entry.match(/target:([^,]+)/)?.[1];
                    const isGroup = entry.includes('isGroup:true');
                    const msg = entry.match(/msg:([^,]+)/)?.[1];
                    
                    if (!from || !target || !msg) return;
                    
                    // Determinar la clave del chat
                    let chatKey;
                    let messageFrom;
                    
                    if (isGroup) {
                        chatKey = `group_${target}`;
                        messageFrom = from;
                    } else {
                        // Para mensajes privados, la clave es el otro usuario
                        chatKey = from === username ? `user_${target}` : `user_${from}`;
                        messageFrom = from;
                    }
                    
                    // Agregar al cache SIN DUPLICAR
                    if (!messageCache[chatKey]) {
                        messageCache[chatKey] = [];
                    }
                    
                    // Verificar si el mensaje ya existe (por contenido y from)
                    const isDuplicate = messageCache[chatKey].some(m => 
                        m.from === messageFrom && m.content === msg
                    );
                    
                    if (!isDuplicate) {
                        messageCache[chatKey].push({
                            from: messageFrom,
                            content: msg,
                            isSent: (from === username),
                            timestamp: new Date()
                        });
                    }
                } catch (err) {
                    console.error('Error parsing history entry:', entry, err);
                }
            });
            
            console.log('[DEBUG] Loaded message history, cache:', messageCache);
        }
    } catch (error) {
        console.error('Error loading message history:', error);
    }
}

let pollingInterval = null;

function startMessagePolling(username) {
    // Clear any existing interval
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    // Poll every 2 seconds
    pollingInterval = setInterval(async () => {
        try {
            const result = await getPendingMessages(username);
            if (result.success && result.messages && result.messages.length > 0) {
                result.messages.forEach(msg => {
                    processIncomingMessage(msg);
                });
            }
        } catch (error) {
            console.error('Error polling messages:', error);
        }
    }, 2000);
}

function processIncomingMessage(msg) {
    // Format: "MSG|from|content" or "GROUP|groupName|from|content"
    const parts = msg.split('|');
    
    console.log('Processing incoming message:', msg, 'Parts:', parts);
    
    if (parts[0] === 'MSG') {
        // Direct message
        const from = parts[1];
        const content = parts[2];
        const chatKey = `user_${from}`;
        
        console.log('Direct message from:', from, 'Current chat:', currentChat);
        
        // Agregar al cache SIN DUPLICAR
        if (!messageCache[chatKey]) {
            messageCache[chatKey] = [];
        }
        
        // Verificar si el mensaje ya existe
        const isDuplicate = messageCache[chatKey].some(m => 
            m.from === from && m.content === content
        );
        
        if (!isDuplicate) {
            messageCache[chatKey].push({ from, content, isSent: false, timestamp: new Date() });
            
            // Only show if we're in that conversation
            if (currentChat && currentChat.type === 'user' && currentChat.name === from) {
                addMessageToUI(from, content, false);
            }
        }
    } else if (parts[0] === 'GROUP') {
        // Group message
        const groupName = parts[1];
        const from = parts[2];
        const content = parts[3];
        const chatKey = `group_${groupName}`;
        
        console.log('Group message - Group:', groupName, 'From:', from, 'Current chat:', currentChat);
        
        // Agregar al cache SIN DUPLICAR
        if (!messageCache[chatKey]) {
            messageCache[chatKey] = [];
        }
        
        // Verificar si el mensaje ya existe
        const isDuplicate = messageCache[chatKey].some(m => 
            m.from === from && m.content === content
        );
        
        if (!isDuplicate) {
            messageCache[chatKey].push({ from, content, isSent: false, timestamp: new Date() });
            
            // Only show if we're in that group conversation
            if (currentChat && currentChat.type === 'group' && currentChat.name === groupName) {
                addMessageToUI(from, content, false);
            }
        }
    }
}

async function showUsers() {
    const content = document.getElementById('sidebar-content');
    content.innerHTML = '<p style="padding: 20px; text-align: center;">Loading users...</p>';
    
    // Clear group polling interval if active
    if (groupListInterval) {
        clearInterval(groupListInterval);
        groupListInterval = null;
    }
        // Start user list polling
    if (!userListInterval) {
        userListInterval = setInterval(loadUsersList, 5001); // Refresh every 5 seconds
    }
    
    await loadUsersList();
}

async function loadUsersList() {
    const content = document.getElementById('sidebar-content');
    
    try {
        const result = await getAllUsers();
        content.innerHTML = '';
        
        if (!result.success || !result.users) {
            content.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No users found</p>';
            return;
        }
        
        const currentUsername = sessionStorage.getItem('username');
        const usersMap = result.users; // {username: isOnline}
        
        // Mostrar todos los usuarios sin distinción de estado
        const allUsers = Object.keys(usersMap).filter(username => username !== currentUsername);
        
        if (allUsers.length === 0) {
            content.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No other users</p>';
            return;
        }
        
        // Crear header simple
        const header = document.createElement('div');
        header.style.cssText = 'padding: 10px 15px; font-weight: 600; color: #E9EDEF; font-size: 0.85rem;';
        header.innerText = `USERS (${allUsers.length})`;
        content.appendChild(header);
        
        // Mostrar todos los usuarios
        allUsers.forEach(username => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.setAttribute('data-username', username);
            userItem.onclick = () => selectUser(username);
            
            // Verificar si el usuario tiene imagen de perfil
            const savedImage = localStorage.getItem(`profile-image-${username}`);
            
            const avatar = document.createElement('div');
            avatar.className = 'user-avatar';
            
            if (savedImage) {
                // Si tiene imagen, usar como background
                avatar.style.backgroundImage = `url(${savedImage})`;
                avatar.style.backgroundSize = 'cover';
                avatar.style.backgroundPosition = 'center';
            } else {
                // Si no tiene imagen, usar el avatar estilo WhatsApp
                avatar.classList.add('user-avatar-default');
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('viewBox', '0 0 24 24');
                svg.setAttribute('fill', 'currentColor');
                svg.setAttribute('width', '24px');
                svg.setAttribute('height', '24px');
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z');
                
                svg.appendChild(path);
                avatar.appendChild(svg);
            }
            
            userItem.appendChild(avatar);
            
            const info = document.createElement('div');
            info.className = 'user-info';
            
            const name = document.createElement('div');
            name.className = 'user-name';
            name.innerText = username;
            
            info.appendChild(name);
            userItem.appendChild(avatar);
            userItem.appendChild(info);
            content.appendChild(userItem);
        });
        
    } catch (error) {
        console.error('Error loading users:', error);
        content.innerHTML = '<p style="padding: 20px; text-align: center; color: red;">Error loading users</p>';
    }
}

async function showGroups() {
    const content = document.getElementById('sidebar-content');
    content.innerHTML = '<p style="padding: 20px; text-align: center;">Loading groups...</p>';
    
    // Clear user polling interval if active
    if (userListInterval) {
        clearInterval(userListInterval);
        userListInterval = null;
    }
    
    // Start group list polling
    if (!groupListInterval) {
        groupListInterval = setInterval(loadGroupsList, 5001); // Refresh every 5 seconds
    }
    
    await loadGroupsList();
}

async function loadGroupsList() {
    const content = document.getElementById('sidebar-content');
    
    try {
        const username = sessionStorage.getItem('username');
        const result = await getUserGroups(username);
        content.innerHTML = '';
        
        const createBtn = document.createElement('button');
        createBtn.className = 'create-group-btn';
        createBtn.innerText = '+ Create Group';
        createBtn.style.cssText = 'margin: 10px; padding: 10px; width: calc(100% - 20px); background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;';
        createBtn.onclick = showCreateGroupDialog;
        content.appendChild(createBtn);
        
        if (!result.success || !result.groups || result.groups.length === 0) {
            const noGroups = document.createElement('p');
            noGroups.style.cssText = 'padding: 20px; text-align: center; color: #999;';
            noGroups.innerText = 'No groups yet. Create one!';
            content.appendChild(noGroups);
            return;
        }
        
        result.groups.forEach(groupName => {
            const groupItem = document.createElement('div');
            groupItem.className = 'group-item';
            groupItem.setAttribute('data-groupname', groupName);
            groupItem.onclick = () => selectGroup(groupName);
            
            const avatar = document.createElement('div');
            avatar.className = 'user-avatar';
            
            // Cargar ícono personalizado si existe
            const savedIcon = localStorage.getItem(`group-icon-${groupName}`);
            if (savedIcon) {
                avatar.style.backgroundImage = `url(${savedIcon})`;
                avatar.style.backgroundSize = 'cover';
                avatar.style.backgroundPosition = 'center';
                avatar.innerText = '';
            } else {
                avatar.innerText = groupName.charAt(0).toUpperCase();
                avatar.style.background = '#28a745';
            }
            
            const info = document.createElement('div');
            info.className = 'user-info';
            
            const name = document.createElement('div');
            name.className = 'user-name';
            name.innerText = groupName;
            
            const status = document.createElement('div');
            status.className = 'user-status';
            status.innerText = 'group';
            
            info.appendChild(name);
            info.appendChild(status);
            groupItem.appendChild(avatar);
            groupItem.appendChild(info);
            content.appendChild(groupItem);
        });
    } catch (error) {
        console.error('Error loading groups:', error);
        content.innerHTML = '<p style="padding: 20px; text-align: center; color: red;">Error loading groups</p>';
    }
}

async function showCreateGroupDialog() {
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '500px';
    
    const title = document.createElement('h2');
    title.innerText = 'Create New Group';
    title.style.marginBottom = '20px';
    
    const groupNameLabel = document.createElement('label');
    groupNameLabel.innerText = 'Group Name:';
    groupNameLabel.style.display = 'block';
    groupNameLabel.style.marginBottom = '8px';
    groupNameLabel.style.fontWeight = '600';
    
    const groupNameInput = document.createElement('input');
    groupNameInput.type = 'text';
    groupNameInput.placeholder = 'Enter group name...';
    groupNameInput.style.marginBottom = '15px';
    
    const membersLabel = document.createElement('label');
    membersLabel.innerText = 'Select Members:';
    membersLabel.style.display = 'block';
    membersLabel.style.marginBottom = '8px';
    membersLabel.style.fontWeight = '600';
    
    const usersList = document.createElement('div');
    usersList.className = 'group-modal-users';
    usersList.innerHTML = '<p style="text-align: center; padding: 20px;">Loading users...</p>';
    
    // Obtener TODOS los usuarios (no solo online)
    try {
        const result = await getAllUsers();
        const currentUsername = sessionStorage.getItem('username');
        
        if (result.success && result.users) {
            usersList.innerHTML = '';
            
            // result.users es un objeto {username: isOnline}
            const allUsernames = Object.keys(result.users).filter(u => u !== currentUsername);
            
            if (allUsernames.length > 0) {
                allUsernames.forEach(username => {
                    const item = document.createElement('div');
                    item.className = 'user-checkbox-item';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `user-${username}`;
                    checkbox.value = username;
                    
                    const label = document.createElement('label');
                    label.htmlFor = `user-${username}`;
                    label.innerText = username;
                    
                    item.appendChild(checkbox);
                    item.appendChild(label);
                    usersList.appendChild(item);
                    
                    // Make entire item clickable
                    item.onclick = (e) => {
                        if (e.target !== checkbox) {
                            checkbox.checked = !checkbox.checked;
                        }
                    };
                });
                
                const info = document.createElement('div');
                info.className = 'group-modal-info';
                info.innerText = `You will be added as admin automatically`;
                usersList.appendChild(info);
            } else {
                usersList.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">No other users available</p>';
            }
        } else {
            usersList.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">No other users available</p>';
        }
    } catch (error) {
        usersList.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">Error loading users</p>';
    }
    
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel';
    cancelBtn.innerText = 'Cancel';
    cancelBtn.onclick = () => {
        document.body.removeChild(modal);
    };
    
    const createBtn = document.createElement('button');
    createBtn.className = 'btn-create';
    createBtn.innerText = 'Create Group';
    createBtn.onclick = async () => {
        const groupName = groupNameInput.value.trim();
        if (!groupName) {
            alert('Please enter a group name');
            return;
        }
        
        const username = sessionStorage.getItem('username');
        const checkboxes = usersList.querySelectorAll('input[type="checkbox"]:checked');
        const selectedUsers = Array.from(checkboxes).map(cb => cb.value);
        
        try {
            // Crear grupo
            const result = await createGroup(groupName, username);
            if (!result.success) {
                alert('Error creating group: ' + result.message);
                return;
            }
            
            // Agregar miembros seleccionados
            for (const member of selectedUsers) {
                await addMemberToGroup(groupName, member);
            }
            
            document.body.removeChild(modal);
            alert(`Group "${groupName}" created with ${selectedUsers.length} members!`);
            showGroups(); // Refresh
        } catch (error) {
            alert('Error creating group: ' + error.message);
        }
    };
    
    actions.appendChild(cancelBtn);
    actions.appendChild(createBtn);
    
    modalContent.appendChild(title);
    modalContent.appendChild(groupNameLabel);
    modalContent.appendChild(groupNameInput);
    modalContent.appendChild(membersLabel);
    modalContent.appendChild(usersList);
    modalContent.appendChild(actions);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    groupNameInput.focus();
}

async function showGroupSettings() {
    if (!currentChat || currentChat.type !== 'group') return;
    
    const groupName = currentChat.name;
    const username = sessionStorage.getItem('username');
    
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '500px';
    
    const title = document.createElement('h2');
    title.innerText = 'Group Settings';
    title.style.cssText = 'margin-bottom: 10px; color: #E9EDEF; font-size: 24px;';
    
    const groupNameTitle = document.createElement('h3');
    groupNameTitle.innerText = groupName;
    groupNameTitle.style.cssText = 'color: #00A884; margin-bottom: 30px; font-size: 18px; font-weight: 500;';
    
    // Sección de ícono del grupo
    const iconSection = document.createElement('div');
    iconSection.className = 'settings-section';
    
    const iconLabel = document.createElement('label');
    iconLabel.innerText = 'Group Icon';
    iconLabel.className = 'settings-label';
    
    const iconPreview = document.createElement('div');
    iconPreview.style.cssText = 'width: 100px; height: 100px; border-radius: 50%; background: #28a745; display: flex; align-items: center; justify-content: center; font-size: 48px; color: white; margin: 0 auto 15px; position: relative; cursor: pointer;';
    
    // Cargar ícono guardado o usar inicial
    const savedIcon = localStorage.getItem(`group-icon-${groupName}`);
    if (savedIcon) {
        iconPreview.style.backgroundImage = `url(${savedIcon})`;
        iconPreview.style.backgroundSize = 'cover';
        iconPreview.style.backgroundPosition = 'center';
        iconPreview.innerText = '';
    } else {
        iconPreview.innerText = groupName.charAt(0).toUpperCase();
    }
    
    const iconUploadBtn = document.createElement('button');
    iconUploadBtn.className = 'settings-upload-btn';
    iconUploadBtn.innerText = 'Change Icon';
    
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
                localStorage.setItem(`group-icon-${groupName}`, imageData);
                iconPreview.style.backgroundImage = `url(${imageData})`;
                iconPreview.style.backgroundSize = 'cover';
                iconPreview.style.backgroundPosition = 'center';
                iconPreview.innerText = '';
                
                // Actualizar ícono en la lista de grupos
                updateGroupIconInList(groupName, imageData);
            };
            reader.readAsDataURL(file);
        }
    };
    
    iconUploadBtn.onclick = () => fileInput.click();
    iconPreview.onclick = () => fileInput.click();
    
    iconSection.appendChild(iconLabel);
    iconSection.appendChild(iconPreview);
    iconSection.appendChild(iconUploadBtn);
    iconSection.appendChild(fileInput);
    
    const membersSection = document.createElement('div');
    membersSection.className = 'settings-section';
    
    const membersLabel = document.createElement('label');
    membersLabel.innerText = 'Add Members';
    membersLabel.className = 'settings-label';
    
    const usersList = document.createElement('div');
    usersList.className = 'group-modal-users';
    usersList.innerHTML = '<p style="text-align: center; padding: 20px;">Loading users...</p>';
    
    try {
        const result = await getAllUsers();
        
        if (result.success && result.users) {
            usersList.innerHTML = '';
            
            const allUsernames = Object.keys(result.users).filter(u => u !== username);
            
            if (allUsernames.length > 0) {
                allUsernames.forEach(user => {
                    const item = document.createElement('div');
                    item.className = 'user-checkbox-item';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `add-user-${user}`;
                    checkbox.value = user;
                    
                    const label = document.createElement('label');
                    label.htmlFor = `add-user-${user}`;
                    label.innerText = user;
                    
                    item.appendChild(checkbox);
                    item.appendChild(label);
                    usersList.appendChild(item);
                    
                    item.onclick = (e) => {
                        if (e.target !== checkbox) {
                            checkbox.checked = !checkbox.checked;
                        }
                    };
                });
            } else {
                usersList.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">No other users available</p>';
            }
        }
    } catch (error) {
        usersList.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">Error loading users</p>';
    }
    
    const addMembersBtn = document.createElement('button');
    addMembersBtn.className = 'settings-action-btn';
    addMembersBtn.innerText = 'Add Selected Members';
    addMembersBtn.onclick = async () => {
        const checkboxes = usersList.querySelectorAll('input[type="checkbox"]:checked');
        const selectedUsers = Array.from(checkboxes).map(cb => cb.value);
        
        if (selectedUsers.length === 0) {
            alert('Please select at least one user');
            return;
        }
        
        try {
            for (const member of selectedUsers) {
                await addMemberToGroup(groupName, member);
            }
            alert(`Added ${selectedUsers.length} members to the group!`);
            checkboxes.forEach(cb => cb.checked = false);
        } catch (error) {
            alert('Error adding members: ' + error.message);
        }
    };
    
    membersSection.appendChild(membersLabel);
    membersSection.appendChild(usersList);
    membersSection.appendChild(addMembersBtn);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'settings-close-btn';
    closeBtn.innerText = 'Close';
    closeBtn.onclick = () => {
        document.body.removeChild(modal);
    };
    
    modalContent.appendChild(title);
    modalContent.appendChild(groupNameTitle);
    modalContent.appendChild(iconSection);
    modalContent.appendChild(membersSection);
    modalContent.appendChild(closeBtn);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

function updateGroupIconInList(groupName, imageData) {
    const groupItems = document.querySelectorAll('.user-item');
    groupItems.forEach(item => {
        const nameDiv = item.querySelector('.user-name');
        if (nameDiv && nameDiv.innerText === groupName) {
            const avatar = item.querySelector('.user-avatar');
            if (avatar) {
                avatar.style.backgroundImage = `url(${imageData})`;
                avatar.style.backgroundSize = 'cover';
                avatar.style.backgroundPosition = 'center';
                avatar.innerText = '';
            }
        }
    });
}

async function showAddMembersDialog(groupName) {
    try {
        const result = await getOnlineUsers();
        if (!result.success || !result.users) {
            alert('Error loading users');
            return;
        }
        
        const username = sessionStorage.getItem('username');
        const otherUsers = result.users.filter(u => u !== username);
        
        if (otherUsers.length === 0) {
            alert('No other users online');
            showGroups();
            return;
        }
        
        const membersToAdd = prompt(
            'Enter usernames to add (comma-separated):\nAvailable: ' + otherUsers.join(', ')
        );
        
        if (!membersToAdd) {
            showGroups();
            return;
        }
        
        const members = membersToAdd.split(',').map(m => m.trim());
        
        // Add each member
        for (const member of members) {
            if (otherUsers.includes(member)) {
                await addMemberToGroup(groupName, member);
            }
        }
        
        alert('Members added successfully!');
        showGroups();
        
    } catch (error) {
        console.error('Error adding members:', error);
        alert('Failed to add members');
        showGroups();
    }
}

async function selectGroup(groupName) {
    currentChat = { type: 'group', name: groupName };
    
    document.getElementById('chat-title').innerText = '👥 ' + groupName;
    
    // Cerrar panel de información de usuario si está abierto
    const userInfoPanel = document.querySelector('.user-info-panel');
    if (userInfoPanel) {
        userInfoPanel.classList.remove('visible');
    }
    
    // Ocultar avatar (no mostrar avatar para grupos)
    const chatAvatar = document.getElementById('chat-avatar');
    if (chatAvatar) {
        chatAvatar.style.display = 'none';
    }
    
    // Mostrar botón de configuración del grupo
    const groupSettingsBtn = document.getElementById('group-settings-btn');
    if (groupSettingsBtn) {
        groupSettingsBtn.style.display = 'block';
    }
    
    // Mostrar input de mensaje
    const inputArea = document.getElementById('chat-input-area');
    if (inputArea) {
        inputArea.style.display = 'flex';
    }
    
    // Clear previous selection
    document.querySelectorAll('.user-item, .group-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mark selected by group name
    const selectedItem = document.querySelector(`.group-item[data-groupname="${groupName}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    // Auto-join group if not already a member
    const username = sessionStorage.getItem('username');
    try {
        await addMemberToGroup(groupName, username);
    } catch (error) {
        console.log('Already in group or error joining:', error);
    }
    
    // Load messages from cache
    const messagesArea = document.getElementById('chat-messages');
    messagesArea.innerHTML = '';
    
    const chatKey = `group_${groupName}`;
    if (messageCache[chatKey] && messageCache[chatKey].length > 0) {
        messageCache[chatKey].forEach(msg => {
            addMessageToUI(msg.from, msg.content, msg.isSent);
        });
    } else {
        messagesArea.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Group chat: ' + groupName + '</p>';
    }
}

let currentChat = null;
let messageCache = {}; // Cache de mensajes por conversación
let userListInterval = null;
let groupListInterval = null;

// Exponer messageCache globalmente para UserInfoPanel
window.messageCache = messageCache;

function selectUser(username) {
    currentChat = { type: 'user', name: username };
    
    document.getElementById('chat-title').innerText = username;
    
    // Cerrar panel de información de usuario si está abierto
    const userInfoPanel = document.querySelector('.user-info-panel');
    if (userInfoPanel) {
        userInfoPanel.classList.remove('visible');
    }
    
    // Mostrar avatar del usuario
    const chatAvatar = document.getElementById('chat-avatar');
    if (chatAvatar) {
        const savedImage = localStorage.getItem(`profile-image-${username}`);
        if (savedImage) {
            chatAvatar.src = savedImage;
        } else {
            // Si no hay imagen guardada, usar avatar por defecto
            chatAvatar.src = defaultAvatar;
        }
        chatAvatar.style.display = 'block';
    }
    
    // Ocultar botón de configuración del grupo
    const groupSettingsBtn = document.getElementById('group-settings-btn');
    if (groupSettingsBtn) {
        groupSettingsBtn.style.display = 'none';
    }
    
    // Mostrar input de mensaje
    const inputArea = document.getElementById('chat-input-area');
    if (inputArea) {
        inputArea.style.display = 'flex';
    }
    
    // Clear previous selection
    document.querySelectorAll('.user-item, .group-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mark selected by username
    const selectedItem = document.querySelector(`.user-item[data-username="${username}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    // Load messages from cache
    const messagesArea = document.getElementById('chat-messages');
    messagesArea.innerHTML = '';
    
    const chatKey = `user_${username}`;
    if (messageCache[chatKey] && messageCache[chatKey].length > 0) {
        messageCache[chatKey].forEach(msg => {
            addMessageToUI(msg.from, msg.content, msg.isSent);
        });
    } else {
        messagesArea.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Start a conversation with ' + username + '</p>';
    }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message || !currentChat) return;
    
    const username = sessionStorage.getItem('username');
    
    try {
        let result;
        let chatKey;
        
        if (currentChat.type === 'user') {
            result = await sendMessageToUser(username, currentChat.name, message);
            chatKey = `user_${currentChat.name}`;
        } else if (currentChat.type === 'group') {
            result = await sendMessageToGroup(username, currentChat.name, message);
            chatKey = `group_${currentChat.name}`;
        }
        
        if (!result.success) {
            alert('Error al enviar mensaje: ' + result.message);
            return;
        }
        
        // Guardar en cache
        if (!messageCache[chatKey]) {
            messageCache[chatKey] = [];
        }
        messageCache[chatKey].push({ from: username, content: message, isSent: true, timestamp: new Date() });
        
        // Add message to UI
        addMessageToUI(username, message, true);
        
        input.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
    }
}

function addMessageToUI(from, content, isSent) {
    const messagesArea = document.getElementById('chat-messages');
    
    // Remove placeholder if exists
    if (messagesArea.children.length === 1 && messagesArea.children[0].tagName === 'P') {
        messagesArea.innerHTML = '';
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + (isSent ? 'sent' : 'received');
    
    const header = document.createElement('div');
    header.className = 'message-header';
    header.innerText = from;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerText = content;
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.innerText = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(header);
    messageDiv.appendChild(bubble);
    messageDiv.appendChild(time);
    
    messagesArea.appendChild(messageDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

export default Chat;
