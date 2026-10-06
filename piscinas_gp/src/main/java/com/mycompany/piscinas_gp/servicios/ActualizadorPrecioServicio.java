package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.daos.ProductoDAO;
import com.mycompany.piscinas_gp.dtos.ActualizacionPrecioDTO;
import com.mycompany.piscinas_gp.dtos.EstadoImportacion;
import com.mycompany.piscinas_gp.dtos.ProductoImportDTO;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.Producto;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Compara los precios de un Excel (mismo formato que usa el importador)
 * contra los precios ya guardados, buscando cada producto por codigo de
 * proveedor + marca. No da de alta productos nuevos: eso sigue siendo
 * responsabilidad del importador.
 */
public class ActualizadorPrecioServicio {

    private static final Logger logger = LoggerFactory.getLogger(ActualizadorPrecioServicio.class);

    private final ImportadorExcelServicio importadorExcelServicio;
    private final ProductoDAO productoDAO;

    public ActualizadorPrecioServicio(ImportadorExcelServicio importadorExcelServicio, ProductoDAO productoDAO) {
        this.importadorExcelServicio = importadorExcelServicio;
        this.productoDAO = productoDAO;
    }

    /**
     * Lee el Excel y devuelve solo las filas donde el producto ya existe
     * (por codigo de proveedor + marca) y el precio del archivo es distinto
     * al que ya esta guardado. Si el precio es igual, o el codigo no
     * corresponde a ningun producto existente, la fila no se incluye.
     */
    public List<ActualizacionPrecioDTO> previsualizarActualizacion(InputStream excelInputStream, Long marcaId)
            throws ServiceException, IOException {

        List<ProductoImportDTO> filasParsed = importadorExcelServicio.parsear(excelInputStream, marcaId);
        List<ActualizacionPrecioDTO> resultado = new ArrayList<>();

        for (ProductoImportDTO fila : filasParsed) {

            if (fila.getEstado() == EstadoImportacion.ERROR) {
                continue; // fila no parseable, no hay con que buscar
            }

            String codigo = fila.getCodigoProveedor();
            if (codigo == null || codigo.isBlank()) {
                continue; // sin codigo no se puede identificar el producto existente
            }

            try {
                Producto producto = productoDAO.buscarPorCodigoProveedorYMarca(codigo, marcaId);

                if (producto == null) {
                    continue; // no existe todavia; eso lo resuelve el importador de altas, no esta pantalla
                }

                BigDecimal precioNuevo = fila.getPrecio();

                if (precioNuevo == null || precioNuevo.compareTo(BigDecimal.ZERO) <= 0) {
                    continue; // el archivo no trae un precio valido para esta fila
                }

                if (precioNuevo.compareTo(producto.getPrecioActual()) == 0) {
                    continue; // mismo precio, no hay nada para actualizar
                }

                resultado.add(new ActualizacionPrecioDTO(
                        producto.getId(),
                        codigo,
                        producto.getNombre(), // el nombre real guardado, no el reparseado del excel
                        producto.getPrecioActual(),
                        precioNuevo
                ));

            } catch (PersistenceException e) {
                logger.error("Error al buscar producto por codigo {} para comparar precio", codigo, e);
                throw new ServiceException("Error al comparar precios", e);
            }
        }

        return resultado;
    }

    /**
     * Actualiza unicamente el precio de los productos que el usuario
     * selecciono (la lista que llega ya viene filtrada desde el frontend
     * con solo las filas aceptadas).
     */
    public List<ActualizacionPrecioDTO> confirmarActualizacion(List<ActualizacionPrecioDTO> seleccionadas)
            throws ServiceException {

        List<ActualizacionPrecioDTO> actualizados = new ArrayList<>();

        for (ActualizacionPrecioDTO item : seleccionadas) {

            try {
                Producto producto = productoDAO.buscarPorId(item.getProductoId());

                if (producto == null) {
                    logger.warn("No se encontro el producto id {} al confirmar actualizacion de precio", item.getProductoId());
                    continue;
                }

                producto.setPrecioActual(item.getPrecioNuevo());
                productoDAO.actualizar(producto);
                actualizados.add(item);

            } catch (PersistenceException | IllegalArgumentException e) {
                logger.error("Error al actualizar el precio del producto id {}", item.getProductoId(), e);
                // se sigue con el resto de las filas, no se corta todo por una que falla
            }
        }

        logger.info("Actualizacion de precios: {} de {} productos actualizados", actualizados.size(), seleccionadas.size());

        return actualizados;
    }
}