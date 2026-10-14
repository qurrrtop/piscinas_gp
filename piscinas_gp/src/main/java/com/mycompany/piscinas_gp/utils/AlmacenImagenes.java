package com.mycompany.piscinas_gp.utils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// Carpeta donde se guardan las imagenes de evidencia de los servicios.
public final class AlmacenImagenes {

    private static final Logger logger = LoggerFactory.getLogger(AlmacenImagenes.class);

    public static final Path DIRECTORIO = Paths.get(
            System.getProperty("user.home"), "piscinas_gp_data", "imagenes_servicios"
    ).toAbsolutePath().normalize();

    private AlmacenImagenes() {
    }

    public static void borrar(String nombreArchivo) {
        if (nombreArchivo == null || nombreArchivo.isBlank()) {
            return;
        }

        try {
            Path archivo = DIRECTORIO.resolve(nombreArchivo).normalize();

            // nunca borrar nada fuera de la carpeta de imagenes
            if (!archivo.startsWith(DIRECTORIO) || archivo.equals(DIRECTORIO)) {
                logger.warn("Se ignoro el borrado de una ruta fuera de la carpeta de imagenes: {}", nombreArchivo);
                return;
            }

            Files.deleteIfExists(archivo);

        } catch (IOException | InvalidPathException e) {
            // el guardado en la base ya se confirmo; un archivo que no se pudo borrar no debe fallar el pedido
            logger.warn("No se pudo borrar la imagen {}", nombreArchivo, e);
        }
    }
}