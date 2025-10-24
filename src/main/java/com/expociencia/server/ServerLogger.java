package com.expociencia.server;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class ServerLogger {
    private static PrintStream logStream;
    private static final DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");

    static {
        try {
            // El 'true' en FileOutputStream habilita el modo de apendizaje (append)
            logStream = new PrintStream(new FileOutputStream("server_output.log", true));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static synchronized void log(String message) {
        String logMessage = dtf.format(LocalDateTime.now()) + ": " + message;
        System.out.println(logMessage); // También imprimir en consola por si acaso
        if (logStream != null) {
            logStream.println(logMessage);
            logStream.flush();
        }
    }

    public static synchronized void error(String message, Throwable throwable) {
        String logMessage = dtf.format(LocalDateTime.now()) + " [ERROR]: " + message;
        System.err.println(logMessage);
        if (throwable != null) {
            throwable.printStackTrace(System.err);
        }

        if (logStream != null) {
            logStream.println(logMessage);
            if (throwable != null) {
                throwable.printStackTrace(logStream);
            }
            logStream.flush();
        }
    }

    public static void close() {
        if (logStream != null) {
            logStream.close();
        }
    }
}