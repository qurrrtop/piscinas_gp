package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.daos.CategoriaProductoDAO;
import com.mycompany.piscinas_gp.daos.MarcaProductoDAO;
import com.mycompany.piscinas_gp.daos.ProductoDAO;
import com.mycompany.piscinas_gp.daos.UnidadMedidaDAO;
import com.mycompany.piscinas_gp.exceptions.AppException;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.modelos.Producto;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ProductoServicio {
    private static final Logger logger = LoggerFactory.getLogger(ProductoServicio.class);
    private final ProductoDAO productoDAO;
    private final MarcaProductoDAO marcaProductoDAO;
    private final CategoriaProductoDAO categoriaProductoDAO;
    private final UnidadMedidaDAO unidadMedidaDAO;

    public ProductoServicio(ProductoDAO productoDAO, MarcaProductoDAO marcaProductoDAO,
            CategoriaProductoDAO categoriaProductoDAO, UnidadMedidaDAO unidadMedidaDAO) {
        this.productoDAO = productoDAO;
        this.marcaProductoDAO = marcaProductoDAO;
        this.categoriaProductoDAO = categoriaProductoDAO;
        this.unidadMedidaDAO = unidadMedidaDAO;
    }

    // Busca un producto mediante su ID y controla si existe o no.
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

    // Obtiene la lista completa de productos registrados.
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

    // Crea un nuevo producto y lo guarda en la base de datos.
    public Producto crearProducto(Producto producto) throws AppException {
        logger.debug("Creando producto");
        try {
            if (productoDAO.checkExistenceByField("nombre", producto.getNombre())) {
                logger.warn("Ya existe un producto con el nombre {}", producto.getNombre());
                throw new AppException("Ya existe un producto con el nombre " + producto.getNombre());
            }

            Long marcaId = producto.getMarcaProducto().getId();
            if (marcaProductoDAO.buscarPorId(marcaId) == null) {
                logger.warn("La marca con ID {} no existe", marcaId);
                throw new AppException("La marca indicada no existe");
            }

            Long categoriaId = producto.getCategoriaProducto().getId();
            if (categoriaProductoDAO.buscarPorId(categoriaId) == null) {
                logger.warn("La categoria con ID {} no existe", categoriaId);
                throw new AppException("La categoria indicada no existe");
            }

            Long unidadMedidaId = producto.getUnidadMedida().getId();
            if (unidadMedidaDAO.buscarPorId(unidadMedidaId) == null) {
                logger.warn("La unidad de medida con ID {} no existe", unidadMedidaId);
                throw new AppException("La unidad de medida indicada no existe");
            }

            Producto nuevoProducto = productoDAO.crear(producto);
            logger.info("Producto creado correctamente");
            return nuevoProducto;
        } catch (PersistenceException e) {
            logger.error("Error al crear el producto", e);
            throw new AppException("Error al crear el producto", e);
        }
    }

    // Actualiza los datos de un producto existente.
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

    // Elimina un producto utilizando su ID.
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