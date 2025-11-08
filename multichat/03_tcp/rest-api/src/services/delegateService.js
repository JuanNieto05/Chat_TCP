import net from 'net';

const HOST = 'localhost';
const PORT = 12345;

/**
 * Send request to Java TCP-JSON server
 */
const sendRequest = (action, data) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();

    socket.connect(PORT, HOST, () => {
      const request = {
        action: action,
        data: data,
      };
      socket.write(JSON.stringify(request));
      socket.write('\n');

      socket.once('data', (data) => {
        const message = data.toString().trim();
        try {
          resolve(JSON.parse(message));
        } catch (e) {
          reject(e);
        }
        socket.end();
      });
    });

    socket.on('error', (err) => {
      reject(err);
    });
  });
};

export const login = (username, udpPort) => {
  return sendRequest('LOGIN', { username, udpPort });
};

export const logout = (username) => {
  return sendRequest('LOGOUT', { username });
};

export const sendMessageToUser = (from, to, content) => {
  return sendRequest('SEND_MESSAGE_USER', { from, to, content });
};

export const sendMessageToGroup = (from, groupName, content) => {
  return sendRequest('SEND_MESSAGE_GROUP', { from, groupName, content });
};

export const getOnlineUsers = () => {
  return sendRequest('GET_ONLINE_USERS', {});
};

export const getAllUsers = () => {
  return sendRequest('GET_ALL_USERS', {});
};

export const createGroup = (groupName, creator) => {
  return sendRequest('CREATE_GROUP', { groupName, creator });
};

export const addToGroup = (groupName, username) => {
  return sendRequest('ADD_TO_GROUP', { groupName, username });
};

export const getHistory = (username) => {
  return sendRequest('GET_HISTORY', { username });
};

export const getGroups = () => {
  return sendRequest('GET_GROUPS', {});
};

export const getUserGroups = (username) => {
  return sendRequest('GET_USER_GROUPS', { username });
};

export const getPendingMessages = (username) => {
  return sendRequest('GET_PENDING_MESSAGES', { username });
};

export const clearChatHistory = (user1, user2) => {
  return sendRequest('CLEAR_CHAT_HISTORY', { user1, user2 });
};

export const deleteUser = (username) => {
  return sendRequest('DELETE_USER', { username });
};

export const cleanupInvalidUsers = () => {
  return sendRequest('CLEANUP_INVALID_USERS', {});
};
