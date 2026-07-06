package com.mycompany.piscinas_gp.exceptions;


public class PersistenceException extends AppException {
    
    public PersistenceException ( String message ) {
        super(message);
    }
    
    public PersistenceException( String message, Throwable cause ) {
        super(message, cause);
    }
}

