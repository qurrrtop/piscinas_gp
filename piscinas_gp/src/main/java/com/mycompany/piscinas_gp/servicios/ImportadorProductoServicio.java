package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.daos.ProductoDAO;
import com.mycompany.piscinas_gp.dtos.EstadoImportacion;
import com.mycompany.piscinas_gp.dtos.ProductoImportDTO;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.CategoriaProducto;
import com.mycompany.piscinas_gp.modelos.MarcaProducto;
import com.mycompany.piscinas_gp.modelos.Producto;
import com.mycompany.piscinas_gp.modelos.UnidadMedida;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Orquesta la importacion: recibe los DTOs ya parseados del Excel,
 * resuelve duplicados contra la base y hace el alta masiva de los validos.
 */
public class ImportadorProductoServicio {

    private static final Logger logger = LoggerFactory.getLogger(ImportadorProductoServicio.class);

    private final ProductoDAO productoDAO;

    public ImportadorProductoServicio(ProductoDAO productoDAO) {
        this.productoDAO = productoDAO;
    }

    /**
     * Recorre los DTOs que vinieron VALIDO o ADVERTENCIA del parseo y chequea
     * si ya existen en la base (nombre + marca + contenido + unidad de medida).
     * Los que ya vinieron en ERROR (nombre no parseado) no se tocan.
     */
    public List<ProductoImportDTO> validarDuplicados(List<ProductoImportDTO> lista) throws ServiceException {

        for (ProductoImportDTO dto : lista) {

            if (dto.getEstado() == EstadoImportacion.ERROR) {
                continue;
            }

            try {
                boolean duplicado = productoDAO.existeProductoDuplicado(
                        dto.getNombre(),
                        dto.getMarcaId(),
                        dto.getContenido(),
                        dto.getUniMedidaId(),
                        null
                );

                if (duplicado) {
                    dto.setEstado(EstadoImportacion.ADVERTENCIA);
                    dto.setMotivo("Ya existe un producto con el mismo nombre, marca, contenido y unidad de medida");
                }

            } catch (PersistenceException e) {
                logger.error("Error al verificar duplicado en fila {}", dto.getFila(), e);
                dto.setEstado(EstadoImportacion.ERROR);
                dto.setMotivo("Error al verificar si el producto ya existe");
            }
        }

        return lista;
    }

    /**
     * Inserta unicamente los productos en estado VALIDO. Los ADVERTENCIA
     * (duplicados) y ERROR se omiten siempre: el usuario ya los vio en el
     * preview y esta lista es la confirmacion final.
     */
    // ImportadorProductoServicio: ahora devuelve la lista con los estados actualizados
    public List<ProductoImportDTO> confirmarImportacion(List<ProductoImportDTO> lista) throws ServiceException {

        for (ProductoImportDTO dto : lista) {

            if (dto.getEstado() != EstadoImportacion.VALIDO) {
                continue;
            }

            try {
                Producto producto = new Producto();
                producto.setNombre(dto.getNombre());

                if (dto.getDescripcion() != null && dto.getDescripcion().trim().length() >= 3) {
                    producto.setDescripcion(dto.getDescripcion());
                }

                producto.setStock(dto.getStock());
                producto.setUmbralStock(dto.getStockMin());
                producto.setPrecioActual(dto.getPrecio());
                producto.setContenido(dto.getContenido());
                producto.setUnidadMedida(new UnidadMedida(dto.getUniMedidaId(), null, null));
                producto.setMarcaProducto(new MarcaProducto(dto.getMarcaId(), null));
                producto.setCategoriaProducto(new CategoriaProducto(dto.getCategoriaId(), null, null));

                productoDAO.crear(producto);

            } catch (IllegalArgumentException e) {
                logger.warn("Fila {} rechazada por validacion: {}", dto.getFila(), e.getMessage());
                dto.setEstado(EstadoImportacion.ERROR);
                dto.setMotivo(e.getMessage());

            } catch (PersistenceException e) {
                logger.error("Error al insertar producto de la fila {}", dto.getFila(), e);
                dto.setEstado(EstadoImportacion.ERROR);
                dto.setMotivo("Error al insertar en la base de datos");
            }
        }

        return lista;
    }
}