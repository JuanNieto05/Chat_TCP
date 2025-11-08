package dtos;

import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.google.gson.Gson;

/**
 * Tests para Request DTO
 */
class RequestTest {

    private Gson gson;

    @BeforeEach
    void setUp() {
        gson = new Gson();
    }

    @Test
    @DisplayName("Deserializar Request con action LOGIN")
    void testDeserializeLoginRequest() {
        String json = "{\"action\":\"LOGIN\",\"data\":{\"username\":\"testUser\",\"udpPort\":5000}}";
        
        Request request = gson.fromJson(json, Request.class);
        
        assertNotNull(request);
        assertEquals("LOGIN", request.action);
        assertNotNull(request.data);
        assertEquals("testUser", request.data.get("username"));
        assertEquals(5000.0, request.data.get("udpPort")); // JSON numbers parse to Double
    }

    @Test
    @DisplayName("Deserializar Request con action SEND_MESSAGE_USER")
    void testDeserializeSendMessageRequest() {
        String json = "{\"action\":\"SEND_MESSAGE_USER\",\"data\":{\"from\":\"user1\",\"to\":\"user2\",\"content\":\"Hola\"}}";
        
        Request request = gson.fromJson(json, Request.class);
        
        assertNotNull(request);
        assertEquals("SEND_MESSAGE_USER", request.action);
        assertEquals("user1", request.data.get("from"));
        assertEquals("user2", request.data.get("to"));
        assertEquals("Hola", request.data.get("content"));
    }

    @Test
    @DisplayName("Deserializar Request con action CREATE_GROUP")
    void testDeserializeCreateGroupRequest() {
        String json = "{\"action\":\"CREATE_GROUP\",\"data\":{\"groupName\":\"testGroup\",\"creator\":\"user1\"}}";
        
        Request request = gson.fromJson(json, Request.class);
        
        assertNotNull(request);
        assertEquals("CREATE_GROUP", request.action);
        assertEquals("testGroup", request.data.get("groupName"));
        assertEquals("user1", request.data.get("creator"));
    }

    @Test
    @DisplayName("Deserializar Request con action CLEAR_CHAT_HISTORY")
    void testDeserializeClearChatHistoryRequest() {
        String json = "{\"action\":\"CLEAR_CHAT_HISTORY\",\"data\":{\"user1\":\"alice\",\"user2\":\"bob\"}}";
        
        Request request = gson.fromJson(json, Request.class);
        
        assertNotNull(request);
        assertEquals("CLEAR_CHAT_HISTORY", request.action);
        assertEquals("alice", request.data.get("user1"));
        assertEquals("bob", request.data.get("user2"));
    }

    @Test
    @DisplayName("Serializar Request a JSON")
    void testSerializeRequest() {
        Request request = new Request();
        request.action = "LOGOUT";
        request.data = new HashMap<>();
        request.data.put("username", "testUser");
        
        String json = gson.toJson(request);
        
        assertNotNull(json);
        assertTrue(json.contains("\"action\":\"LOGOUT\""));
        assertTrue(json.contains("\"username\":\"testUser\""));
    }

    @Test
    @DisplayName("Request con data null")
    void testRequestWithNullData() {
        String json = "{\"action\":\"GET_ONLINE_USERS\",\"data\":null}";
        
        Request request = gson.fromJson(json, Request.class);
        
        assertNotNull(request);
        assertEquals("GET_ONLINE_USERS", request.action);
        assertNull(request.data);
    }

    @Test
    @DisplayName("Request con data vacío")
    void testRequestWithEmptyData() {
        String json = "{\"action\":\"GET_GROUPS\",\"data\":{}}";
        
        Request request = gson.fromJson(json, Request.class);
        
        assertNotNull(request);
        assertEquals("GET_GROUPS", request.action);
        assertNotNull(request.data);
        assertTrue(request.data.isEmpty());
    }

    @Test
    @DisplayName("Request con valores especiales en data")
    void testRequestWithSpecialValues() {
        Request request = new Request();
        request.action = "TEST";
        request.data = new HashMap<>();
        request.data.put("nullValue", null);
        request.data.put("booleanValue", true);
        request.data.put("numberValue", 42);
        request.data.put("stringValue", "test");
        
        String json = gson.toJson(request);
        Request deserialized = gson.fromJson(json, Request.class);
        
        assertEquals("TEST", deserialized.action);
        assertNull(deserialized.data.get("nullValue"));
        assertEquals(true, deserialized.data.get("booleanValue"));
        assertEquals(42.0, deserialized.data.get("numberValue")); // Numbers parse to Double
        assertEquals("test", deserialized.data.get("stringValue"));
    }
}
