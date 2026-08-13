package com.mycompany.piscinas_gp.config;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
// mati con su amigo deam
public final class DbConnection {
    
    private static final String URL = "jdbc:mysql://localhost:3306/piscinas_gp";
    private static final String USER = "root";
    private static final String PASSWORD = "";
    private static DbConnection instance;
    
    //bloque estatico: se ejecuta una unica vez, cuando la clase se carga por primera vez
    //fuerza a que el driver de MySQL se registre en el DriverManager,
    //porque el auto-registro automatico a veces falla dentro de Tomcat
    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new ExceptionInInitializerError("No se encontro el driver de MySQL: " + e.getMessage());
        }
    }
    
    //constructor privado para que nadie instancie desde fuera
    private DbConnection() {
    }
    //synchronized sirve para que solo un hilo a la vez pueda entrar al método.
    // es decir si el primer hilo entra en instance == null. crea objeto
    //al entrar el segundo hilo ve que esta ocupado, espera se desocupa y no crea otro objeto 
    // es decir para que no haya interferencia de hilos y no se creen muchas instancias o objetos
    public static synchronized DbConnection getInstance() {
        if (instance == null) {
            instance = new DbConnection();
        }
        return instance;
    }
    public Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
    
}