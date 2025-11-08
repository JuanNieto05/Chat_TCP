package ui;

import controllers.TCPJSONController;
import services.ChatServicesImpl;
import util.TCPConnection;

public class Main implements TCPConnection.Listener {

    public static void main(String[] args) {
        System.out.println("=== SERVIDOR DE CHAT  ===");
        System.out.println("Servidor TCP original (puerto 6000)");
        System.out.println("Servidor TCP-JSON para proxy HTTP (puerto 12345)");
        System.out.println("====================================\n");

        ChatServicesImpl chatServices = new ChatServicesImpl();

        Main m = new Main();
        TCPConnection srv = TCPConnection.getInstance();
        srv.initAsServer(6000);
        srv.setListener(m);
        new Thread(() -> srv.start()).start();

        TCPJSONController tcpJsonController = new TCPJSONController(chatServices, 12345);
        tcpJsonController.start();

        System.out.println("\nServidores iniciados correctamente");
        System.out.println("Presiona Ctrl+C para detener\n");

        try {
            Thread.currentThread().join();
        } catch (InterruptedException e) {
            System.out.println("Servidor detenido");
        }
    }

    @Override
    public void onLog(String line) {
        System.out.println(line);
    }
}
