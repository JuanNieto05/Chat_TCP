/**
 * ICE Delegate Service - Comunicación con el backend Java vía Ice
 */

const HOSTNAME = 'localhost';
const ICE_PORT = 9099;

let communicator = null;
let chatProxy = null;

/**
 * Initialize Ice communicator and get proxy
 */
async function getProxy() {
    if (chatProxy) {
        return chatProxy;
    }

    try {
        communicator = Ice.initialize();
        
        const proxyString = `ChatService:ws -h ${HOSTNAME} -p ${ICE_PORT}`;
        const proxy = communicator.stringToProxy(proxyString);
        
        chatProxy = await Chat.ChatServicesPrx.checkedCast(proxy);
        
        if (!chatProxy) {
            throw new Error('Invalid proxy');
        }
        
        console.log('[ICE] Connected to chat server');
        return chatProxy;
    } catch (error) {
        console.error('[ICE] Connection error:', error);
        throw error;
    }
}

/**
 * Login to chat
 */
export async function loginViaICE(username, udpPort = 7000) {
    try {
        const proxy = await getProxy();
        const result = await proxy.login(username, udpPort);
        console.log(`[ICE] Login result for ${username}:`, result);
        return result;
    } catch (error) {
        console.error('[ICE] Login error:', error);
        throw error;
    }
}

/**
 * Logout from chat
 */
export async function logoutViaICE(username) {
    try {
        const proxy = await getProxy();
        const result = await proxy.logout(username);
        console.log(`[ICE] Logout result for ${username}:`, result);
        return result;
    } catch (error) {
        console.error('[ICE] Logout error:', error);
        throw error;
    }
}

/**
 * Get online users
 */
export async function getOnlineUsersViaICE() {
    try {
        const proxy = await getProxy();
        const users = await proxy.getOnlineUsers();
        console.log('[ICE] Online users:', users);
        return users || [];
    } catch (error) {
        console.error('[ICE] Get users error:', error);
        return [];
    }
}

/**
 * Create a group
 */
export async function createGroupViaICE(groupName) {
    try {
        const proxy = await getProxy();
        const result = await proxy.createGroup(groupName);
        console.log(`[ICE] Create group ${groupName}:`, result);
        return result;
    } catch (error) {
        console.error('[ICE] Create group error:', error);
        throw error;
    }
}

/**
 * Add user to group
 */
export async function addToGroupViaICE(groupName, username) {
    try {
        const proxy = await getProxy();
        const result = await proxy.addToGroup(groupName, username);
        console.log(`[ICE] Add ${username} to ${groupName}:`, result);
        return result;
    } catch (error) {
        console.error('[ICE] Add to group error:', error);
        throw error;
    }
}

/**
 * Get all groups
 */
export async function getGroupsViaICE() {
    try {
        const proxy = await getProxy();
        const groups = await proxy.getGroups();
        console.log('[ICE] Groups:', groups);
        return groups || [];
    } catch (error) {
        console.error('[ICE] Get groups error:', error);
        return [];
    }
}

/**
 * Get group members
 */
export async function getGroupMembersViaICE(groupName) {
    try {
        const proxy = await getProxy();
        const members = await proxy.getGroupMembers(groupName);
        console.log(`[ICE] Members of ${groupName}:`, members);
        return members || [];
    } catch (error) {
        console.error('[ICE] Get group members error:', error);
        return [];
    }
}

/**
 * Send message to user
 */
export async function sendMessageViaICE(from, to, message) {
    try {
        const proxy = await getProxy();
        const result = await proxy.sendMessageToUser(from, to, message);
        console.log(`[ICE] Message sent from ${from} to ${to}:`, result);
        return result;
    } catch (error) {
        console.error('[ICE] Send message error:', error);
        throw error;
    }
}

/**
 * Send message to group
 */
export async function sendMessageToGroupViaICE(from, groupName, message) {
    try {
        const proxy = await getProxy();
        const result = await proxy.sendMessageToGroup(from, groupName, message);
        console.log(`[ICE] Message sent from ${from} to group ${groupName}:`, result);
        return result;
    } catch (error) {
        console.error('[ICE] Send group message error:', error);
        throw error;
    }
}

/**
 * Get message history
 */
export async function getHistoryViaICE(username) {
    try {
        const proxy = await getProxy();
        const history = await proxy.getHistory(username);
        console.log(`[ICE] History for ${username}:`, history);
        return history || [];
    } catch (error) {
        console.error('[ICE] Get history error:', error);
        return [];
    }
}

/**
 * Send voice note to user
 */
export async function sendVoiceNoteViaICE(from, to, audioData) {
    try {
        const proxy = await getProxy();
        const result = await proxy.sendVoiceNoteToUser(from, to, audioData);
        console.log(`[ICE] Voice note sent from ${from} to ${to}:`, result);
        return result;
    } catch (error) {
        console.error('[ICE] Send voice note error:', error);
        throw error;
    }
}

/**
 * Call user
 */
export async function callUserViaICE(caller, target) {
    try {
        const proxy = await getProxy();
        const result = await proxy.callUser(caller, target);
        console.log(`[ICE] Call from ${caller} to ${target}:`, result);
        return result;
    } catch (error) {
        console.error('[ICE] Call error:', error);
        throw error;
    }
}

/**
 * Hang up call
 */
export async function hangUpViaICE(username) {
    try {
        const proxy = await getProxy();
        const result = await proxy.hangUp(username);
        console.log(`[ICE] Hang up for ${username}:`, result);
        return result;
    } catch (error) {
        console.error('[ICE] Hang up error:', error);
        throw error;
    }
}
