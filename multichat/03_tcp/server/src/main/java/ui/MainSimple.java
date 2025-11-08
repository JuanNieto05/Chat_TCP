package ui;

import controllers.TCPJSONController;
import services.ChatServicesImpl;

public class MainSimple {

    public static void main(String[] args) {
        System.out.println("=== CHAT SERVER - TCP-JSON Test ===");
        System.out.println("Starting TCP-JSON server on port 12345...");
        System.out.println("====================================\n");

        try {
            ChatServicesImpl chatServices = new ChatServicesImpl();

            TCPJSONController tcpJsonController = new TCPJSONController(chatServices, 12345);
            tcpJsonController.start();

            System.out.println("Server started successfully!");
            System.out.println("Press Ctrl+C to stop...\n");

            Thread.currentThread().join();
            
        } catch (Exception e) {
            System.err.println("Error starting server: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
