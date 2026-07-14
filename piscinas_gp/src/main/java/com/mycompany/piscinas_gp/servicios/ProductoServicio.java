
package com.mycompany.piscinas_gp.servicios;
import com.mycompany.piscinas_gp.daos.ProductoDAO;
import com.mycompany.piscinas_gp.exceptions.AppException;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.modelos.Producto;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ProductoServicio {
   private static final Logger logger = LoggerFactory.getLogger(ProductoServicio.class);

    private final ProductoDAO productoDAO;

    public ProductoServicio(ProductoDAO productoDAO) {
        this.productoDAO = productoDAO;
    }

    public Producto buscarProductoPorId(Long idProducto) throws AppException {
        logger.debug("Buscando producto con ID: {}", idProducto);

        try {

            Producto producto = productoDAO.buscarPorId(idProducto);

            if (producto == null) {
                logger.warn("No se encontró el producto con ID {}", idProducto);
                throw new AppException("No existe un producto con ID " + idProducto);
            }

            logger.info("Producto encontrado con ID {}", idProducto);

            return producto;

        } catch (PersistenceException e) {
            logger.error("Error al buscar el producto con ID {}", idProducto, e);
            throw new AppException("Error al buscar el producto", e);
        }
    }

    public List<Producto> buscarTodosLosProductos() throws AppException {
        logger.debug("Buscando todos los productos");

        try {

            List<Producto> productos = productoDAO.buscarTodos();

            if (productos == null || productos.isEmpty()) {
                logger.warn("No existen productos registrados");
            }

            return productos;

        } catch (PersistenceException e) {
            logger.error("Error al recuperar los productos", e);
            throw new AppException("Error al recuperar los productos", e);
        }
    }

    public Producto crearProducto(Producto producto) throws AppException {
        logger.debug("Creando producto");

        try {

            Producto nuevoProducto = productoDAO.crear(producto);

            logger.info("Producto creado correctamente");

            return nuevoProducto;

        } catch (PersistenceException e) {
            logger.error("Error al crear el producto", e);
            throw new AppException("Error al crear el producto", e);
        }
    }

    public Producto actualizarProducto(Producto producto) throws AppException {
        logger.debug("Actualizando producto con ID {}", producto.getId());

        try {

            Producto productoActualizado = productoDAO.actualizar(producto);

            logger.info("Producto actualizado correctamente");

            return productoActualizado;

        } catch (PersistenceException e) {
            logger.error("Error al actualizar el producto", e);
            throw new AppException("Error al actualizar el producto", e);
        }
    }

    public boolean eliminarProducto(Long idProducto) throws AppException {
        logger.debug("Eliminando producto con ID {}", idProducto);

        try {

            boolean eliminado = productoDAO.eliminarPorId(idProducto);

            if (eliminado) {
                logger.info("Producto eliminado correctamente");
            } else {
                logger.warn("No se pudo eliminar el producto con ID {}", idProducto);
            }

            return eliminado;

        } catch (PersistenceException e) {
            logger.error("Error al eliminar el producto", e);
            throw new AppException("Error al eliminar el producto", e);
        }
    }

}