package util;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;


public class TCPConnection extends Thread {

    private static TCPConnection instance;
    public static synchronized TCPConnection getInstance(){
        if(instance == null) instance = new TCPConnection();
        return instance;
    }
    private TCPConnection(){}

    private ServerSocket serverSocket;
    private volatile boolean running;
    private Listener listener;
    public void setListener(Listener l){ this.listener = l; }
    public void initAsServer(int port){
        try { serverSocket = new ServerSocket(port); }
        catch(IOException e){ throw new RuntimeException(e); }
    }

    private final Map<String, ClientSession> users = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> groups = new ConcurrentHashMap<>();
    private final File dataDir = new File("data");
    private final File historyDir = new File(dataDir, "history");
    private final File mediaDir = new File(dataDir, "media");
    private void log(String s){ if(listener!=null) listener.onLog(s); }

    @Override public void run(){
        if(serverSocket==null) throw new IllegalStateException("initAsServer primero");
        historyDir.mkdirs(); mediaDir.mkdirs();
        running = true;
        log("[SERVER] Escuchando TCP en "+serverSocket.getLocalPort());
        while(running){
            try{
                Socket s = serverSocket.accept();
                new Thread(new Handler(s)).start();
            }catch(IOException e){
                if(running) e.printStackTrace();
            }
        }
    }

    static class ClientSession {
        final String user;
        final Socket socket;
        final PrintWriter out;
        volatile int udpPort; // para llamadas
        ClientSession(String user, Socket socket) throws IOException {
            this.user=user; this.socket=socket;
            this.out = new PrintWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8), true);
        }
    }

    class Handler implements Runnable{
        private final Socket socket;
        Handler(Socket s){ this.socket=s; }

        @Override public void run(){
            String user = null;
            try {
                InputStream in = socket.getInputStream();   // ÚNICO stream para líneas y binario
                PrintWriter out = new PrintWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8), true);

                out.println("HELLO use: LOGIN <user>");

                String line;
                while((line = readAsciiLine(in)) != null){
                    if(line.isBlank()) continue;
                    String[] parts = line.split(" ",2);
                    String cmd = parts[0].toUpperCase(Locale.ROOT);
                    String args = parts.length>1? parts[1] : "";

                    try{
                        switch(cmd){
                            case "LOGIN" -> {
                                if(user!=null){ out.println("ERR already logged"); break; }
                                if(args.isBlank()){ out.println("ERR username required"); break; }
                                String u = args.trim();
                                if(users.containsKey(u)){ out.println("ERR in use"); break; }
                                user = u;
                                users.put(u, new ClientSession(u, socket));
                                broadcast("SYS "+u+" joined");
                                out.println("OK LOGIN");
                            }
                            case "CREATE_GROUP" -> {
                                if(!ensureLogged(user, out)) break;
                                String g = args.trim();
                                if(g.isEmpty()){ out.println("ERR group required"); break; }
                                groups.putIfAbsent(g, ConcurrentHashMap.newKeySet());
                                out.println("OK GROUP "+g);
                            }
                            case "ADD_TO_GROUP" -> {
                                if(!ensureLogged(user, out)) break;
                                String[] a = args.split(" ");
                                if(a.length<2){ out.println("ERR usage: ADD_TO_GROUP <group> <user>"); break; }
                                groups.putIfAbsent(a[0], ConcurrentHashMap.newKeySet());
                                groups.get(a[0]).add(a[1]);
                                out.println("OK ADDED "+a[1]+" TO #"+a[0]);
                            }
                            case "MSG_USER" -> {
                                if(!ensureLogged(user, out)) break;
                                int sp = args.indexOf(' ');
                                if(sp<=0){ out.println("ERR usage: MSG_USER <user> <text>"); break; }
                                String to = args.substring(0,sp);
                                String msg = args.substring(sp+1);
                                sendText(user,to,false,msg);
                                out.println("OK");
                            }
                            case "MSG_GROUP" -> {
                                if(!ensureLogged(user, out)) break;
                                int sp = args.indexOf(' ');
                                if(sp<=0){ out.println("ERR usage: MSG_GROUP <group> <text>"); break; }
                                String g = args.substring(0,sp);
                                String msg = args.substring(sp+1);
                                sendText(user,g,true,msg);
                                out.println("OK");
                            }

              
                            case "VOICE_NOTE_USER" -> {
                                if(!ensureLogged(user, out)) break;
                                int sp = args.indexOf(' ');
                                if(sp<=0){ out.println("ERR usage: VOICE_NOTE_USER <user> <size>"); break; }
                                String to = args.substring(0,sp).trim();
                                int size = Integer.parseInt(args.substring(sp+1).trim());

                                byte[] data = readNBytes(in, size);
                                persistVoice(user,to,false, data);

                                ClientSession s = users.get(to);
                                if (s != null) {
                                    s.out.println("VOICE_NOTE_FROM " + user + " " + data.length);
                                    s.out.flush();
                                    s.socket.getOutputStream().write(data);
                                    s.socket.getOutputStream().flush();
                                }
                                out.println("OK VOICE_NOTE");
                            }
                            case "VOICE_NOTE_GROUP" -> {
                                if(!ensureLogged(user, out)) break;
                                int sp = args.indexOf(' ');
                                if(sp<=0){ out.println("ERR usage: VOICE_NOTE_GROUP <group> <size>"); break; }
                                String g = args.substring(0,sp).trim();
                                int size = Integer.parseInt(args.substring(sp+1).trim());

                                byte[] data = readNBytes(in, size);
                                persistVoice(user,g,true, data);

                                for (String u : groups.getOrDefault(g, Set.of())) {
                                    if (u.equals(user)) continue;
                                    ClientSession s = users.get(u);
                                    if (s != null) {
                                        s.out.println("VOICE_NOTE_FROM " + user + " " + data.length);
                                        s.out.flush();
                                        s.socket.getOutputStream().write(data);
                                        s.socket.getOutputStream().flush();
                                    }
                                }
                                out.println("OK VOICE_NOTE");
                            }

                            case "SET_UDP" -> {
                                if(!ensureLogged(user, out)) break;
                                users.get(user).udpPort = Integer.parseInt(args.trim());
                                out.println("OK UDP "+users.get(user).udpPort);
                            }
                            case "CALL_USER" -> {
                                if(!ensureLogged(user, out)) break;
                                callUser(user, args.trim(), out);
                            }
                            case "CALL_GROUP" -> {
                                if(!ensureLogged(user, out)) break;
                                callGroup(user, args.trim(), out);
                            }
                            case "HISTORY" -> {
                                if(!ensureLogged(user, out)) break;
                                sendHistory(user, out);
                            }
                            default -> out.println("ERR unknown");
                        }
                    }catch(Exception ex){
                        out.println("ERR "+ex.getMessage());
                        ex.printStackTrace();
                    }
                }
            }catch(IOException e){ e.printStackTrace(); }
            finally{
                String leftUser = null;
                for (Map.Entry<String, ClientSession> e : users.entrySet()) {
                    if(e.getValue().socket == socket){
                        leftUser = e.getKey();
                        users.remove(e.getKey());
                        break;
                    }
                }
                if(leftUser != null) broadcast("SYS "+leftUser+" left");
                try { socket.close(); } catch (IOException ignored) {}
            }
        }

        private boolean ensureLogged(String u, PrintWriter out){
            if(u==null){ out.println("ERR login required"); return false; }
            return true;
        }
        private void broadcast(String l){ users.values().forEach(s-> s.out.println(l)); }

        private void sendText(String from, String target, boolean isGroup, String msg) throws IOException{
            String rec = "{type:text,from:"+from+",target:"+target+",isGroup:"+isGroup+",msg:"+msg+",ts:"+Instant.now()+"}";
            persist(from,target,isGroup,rec);
            if(isGroup){
                for(String u: groups.getOrDefault(target, Set.of())){
                    var s = users.get(u);
                    if(s!=null) s.out.println("MSG "+from+" -> #"+target+": "+msg);
                }
            }else{
                var s = users.get(target);
                if(s!=null) s.out.println("MSG "+from+": "+msg);
            }
        }

        private String readAsciiLine(InputStream is) throws IOException {
            ByteArrayOutputStream baos = new ByteArrayOutputStream(128);
            while (true) {
                int b = is.read();
                if (b < 0) { return (baos.size()==0) ? null : baos.toString(StandardCharsets.UTF_8); }
                if (b == '\n') break;
                if (b != '\r') baos.write(b);
            }
            return baos.toString(StandardCharsets.UTF_8);
        }
        private byte[] readNBytes(InputStream in, int size) throws IOException {
            byte[] buf = new byte[size];
            int off = 0;
            while (off < size) {
                int r = in.read(buf, off, size - off);
                if (r < 0) throw new EOFException("fin de flujo al leer nota de voz");
                off += r;
            }
            return buf;
        }

        private void persistVoice(String from, String target, boolean isGroup, byte[] data) throws IOException{
            File f = new File(mediaDir, "vn_"+System.currentTimeMillis()+".raw");
            try(FileOutputStream fos = new FileOutputStream(f)){ fos.write(data); }
            String rec = "{type:voice_note,from:"+from+",target:"+target+",isGroup:"+isGroup+",file:"+f.getPath()+",ts:"+Instant.now()+"}";
            persist(from,target,isGroup,rec);
        }
        private void sendHistory(String user, PrintWriter out) throws IOException{
            File f = new File(historyDir, user+".jsonl");
            out.println("HISTORY_BEGIN");
            if(f.exists()){
                try(BufferedReader r = new BufferedReader(new FileReader(f))){
                    String l; while((l=r.readLine())!=null) out.println(l);
                }
            }
            out.println("HISTORY_END");
        }
        private void persist(String from, String target, boolean isGroup, String line) throws IOException{
            File fs = new File(historyDir, from+".jsonl");
            try(FileWriter fw = new FileWriter(fs,true)){ fw.write(line+"\n"); }
            if(isGroup){
                File fg = new File(historyDir, "#"+target+".jsonl");
                try(FileWriter fw = new FileWriter(fg,true)){ fw.write(line+"\n"); }
            }else{
                File ft = new File(historyDir, target+".jsonl");
                try(FileWriter fw = new FileWriter(ft,true)){ fw.write(line+"\n"); }
            }
        }

        private void callUser(String caller, String target, PrintWriter out){
            var t = users.get(target);
            var c = users.get(caller);
            if(t==null || t.udpPort==0 || c==null || c.udpPort==0){
                out.println("ERR target not ready for UDP"); return;
            }
            out.println("CALL_PEER "+t.socket.getInetAddress().getHostAddress()+" "+t.udpPort);
            t.out.println("INCOMING_CALL "+caller+" "+
                    c.socket.getInetAddress().getHostAddress()+" "+c.udpPort);
        }
        private void callGroup(String caller, String group, PrintWriter out){
            for(String u: groups.getOrDefault(group, Set.of())){
                if(!u.equals(caller)) callUser(caller, u, out);
            }
        }
    }

    public interface Listener{ void onLog(String line); }
}
