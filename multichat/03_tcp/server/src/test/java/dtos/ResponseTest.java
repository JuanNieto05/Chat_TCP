package dtos;

import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import com.google.gson.Gson;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

/**
 * Tests para Response DTO
 */
class ResponseTest {

    private Gson gson;
    private Response response;

    @BeforeEach
    void setUp() {
        gson = new Gson();
        response = new Response();
    }

    @Test
    @DisplayName("Crear Response con status OK")
    void testCreateResponseWithOkStatus() {
        response.setStatus("OK");
        
        assertEquals("OK", response.get("status"));
    }

    @Test
    @DisplayName("Crear Response con success true")
    void testCreateResponseWithSuccess() {
        response.setSuccess(true);
        
        assertEquals(true, response.get("success"));
    }

    @Test
    @DisplayName("Crear Response con mensaje")
    void testCreateResponseWithMessage() {
        response.setMessage("Operación exitosa");
        
        assertEquals("Operación exitosa", response.get("message"));
    }

    @Test
    @DisplayName("Response completo con status, success y message")
    void testCompleteResponse() {
        response.setStatus("OK");
        response.setSuccess(true);
        response.setMessage("Login exitoso");
        
        assertEquals("OK", response.get("status"));
        assertEquals(true, response.get("success"));
        assertEquals("Login exitoso", response.get("message"));
    }

    @Test
    @DisplayName("Response con datos adicionales")
    void testResponseWithAdditionalData() {
        response.setStatus("OK");
        response.setSuccess(true);
        response.put("username", "testUser");
        response.put("userId", 123);
        
        assertEquals("testUser", response.get("username"));
        assertEquals(123, response.get("userId"));
    }

    @Test
    @DisplayName("Response con lista de usuarios")
    void testResponseWithUsersList() {
        List<String> users = new ArrayList<>();
        users.add("user1");
        users.add("user2");
        users.add("user3");
        
        response.setStatus("OK");
        response.setSuccess(true);
        response.put("users", users);
        
        @SuppressWarnings("unchecked")
        List<String> retrievedUsers = (List<String>) response.get("users");
        assertEquals(3, retrievedUsers.size());
        assertTrue(retrievedUsers.contains("user1"));
    }

    @Test
    @DisplayName("Response con mapa de usuarios y estados")
    void testResponseWithUsersStatusMap() {
        Map<String, Boolean> usersStatus = new HashMap<>();
        usersStatus.put("user1", true);
        usersStatus.put("user2", false);
        
        response.setStatus("OK");
        response.setSuccess(true);
        response.put("users", usersStatus);
        
        @SuppressWarnings("unchecked")
        Map<String, Boolean> retrieved = (Map<String, Boolean>) response.get("users");
        assertEquals(2, retrieved.size());
        assertTrue(retrieved.get("user1"));
        assertFalse(retrieved.get("user2"));
    }

    @Test
    @DisplayName("Serializar Response a JSON")
    void testSerializeResponse() {
        response.setStatus("OK");
        response.setSuccess(true);
        response.setMessage("Operación exitosa");
        
        String json = gson.toJson(response);
        
        assertNotNull(json);
        assertTrue(json.contains("\"status\":\"OK\""));
        assertTrue(json.contains("\"success\":true"));
        assertTrue(json.contains("\"message\":\"Operación exitosa\""));
    }

    @Test
    @DisplayName("Deserializar JSON a Response")
    void testDeserializeResponse() {
        String json = "{\"status\":\"ERROR\",\"success\":false,\"message\":\"Usuario no encontrado\"}";
        
        Response deserialized = gson.fromJson(json, Response.class);
        
        assertNotNull(deserialized);
        assertEquals("ERROR", deserialized.get("status"));
        assertEquals(false, deserialized.get("success"));
        assertEquals("Usuario no encontrado", deserialized.get("message"));
    }

    @Test
    @DisplayName("Response vacío es válido")
    void testEmptyResponse() {
        Response empty = new Response();
        
        assertTrue(empty.isEmpty());
        assertEquals(0, empty.size());
    }

    @Test
    @DisplayName("Response con lista de historial")
    void testResponseWithHistory() {
        List<String> history = new ArrayList<>();
        history.add("{\"from\":\"user1\",\"to\":\"user2\",\"content\":\"Hola\"}");
        history.add("{\"from\":\"user2\",\"to\":\"user1\",\"content\":\"Hola!\"}");
        
        response.setStatus("OK");
        response.setSuccess(true);
        response.put("history", history);
        
        @SuppressWarnings("unchecked")
        List<String> retrieved = (List<String>) response.get("history");
        assertEquals(2, retrieved.size());
    }

    @Test
    @DisplayName("Response de error con mensaje descriptivo")
    void testErrorResponse() {
        response.setStatus("ERROR");
        response.setSuccess(false);
        response.setMessage("Error al enviar mensaje: usuario no encontrado");
        
        assertEquals("ERROR", response.get("status"));
        assertEquals(false, response.get("success"));
        assertTrue(((String) response.get("message")).contains("usuario no encontrado"));
    }

    @Test
    @DisplayName("Response hereda de HashMap correctamente")
    void testResponseIsHashMap() {
        response.setStatus("OK");
        response.put("customField", "customValue");
        
        assertTrue(response.containsKey("status"));
        assertTrue(response.containsKey("customField"));
        assertEquals(2, response.size());
    }

    @Test
    @DisplayName("Response con lista de grupos")
    void testResponseWithGroups() {
        List<String> groups = new ArrayList<>();
        groups.add("Familia");
        groups.add("Trabajo");
        
        response.setStatus("OK");
        response.setSuccess(true);
        response.put("groups", groups);
        
        String json = gson.toJson(response);
        Response deserialized = gson.fromJson(json, Response.class);
        
        @SuppressWarnings("unchecked")
        List<String> retrievedGroups = (List<String>) deserialized.get("groups");
        assertEquals(2, retrievedGroups.size());
        assertTrue(retrievedGroups.contains("Familia"));
    }

    @Test
    @DisplayName("Response JSON roundtrip mantiene datos")
    void testJsonRoundtrip() {
        response.setStatus("OK");
        response.setSuccess(true);
        response.put("count", 42);
        response.put("active", true);
        
        String json = gson.toJson(response);
        Response deserialized = gson.fromJson(json, Response.class);
        
        assertEquals(response.get("status"), deserialized.get("status"));
        assertEquals(response.get("success"), deserialized.get("success"));
        // Los números se deserializan como Double en JSON
        assertEquals(42.0, deserialized.get("count"));
        assertEquals(response.get("active"), deserialized.get("active"));
    }
}
