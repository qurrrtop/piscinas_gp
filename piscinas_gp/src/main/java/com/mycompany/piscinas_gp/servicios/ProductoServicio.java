package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.daos.CategoriaProductoDAO;
import com.mycompany.piscinas_gp.daos.MarcaProductoDAO;
import com.mycompany.piscinas_gp.daos.ProductoDAO;
import com.mycompany.piscinas_gp.daos.UnidadMedidaDAO;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
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

    // Busca un producto mediante su ID.
    public Producto buscarProductoPorId(Long idProducto)
            throws ServiceException {

        logger.debug("Buscando producto con ID: {}", idProducto);

        try {

            Producto producto = productoDAO.buscarPorId(idProducto);

            if (producto == null) {
                logger.warn("No se encontró el producto con ID {}", idProducto);
                throw new BusinessException("No existe un producto con ID " + idProducto);
            }
            logger.info("Producto encontrado con ID {}", idProducto);

            return producto;

        } catch (PersistenceException e) {
            logger.error( "Error al buscar el producto con ID {}", idProducto, e);
            throw new ServiceException("Error al buscar el producto", e);
        }
    }

    // Obtiene la lista completa de productos registrados.
    public List<Producto> buscarTodosLosProductos()
            throws ServiceException {

        logger.debug("Buscando todos los productos");

        try {

            List<Producto> productos = productoDAO.buscarTodos();

            if (productos == null || productos.isEmpty()) {
                logger.warn("No existen productos registrados");
            }

            return productos;

        } catch (PersistenceException e) {
            logger.error("Error al recuperar los productos", e);
            throw new ServiceException("Error al recuperar los productos", e);
        }
    }

    // Crea un nuevo producto.
    public Producto crearProducto(Producto producto)
            throws ServiceException {

        logger.debug("Creando producto");

        try {

            boolean duplicado =
                    productoDAO.existeProductoDuplicado(
                            producto.getNombre(),
                            producto.getMarcaProducto().getId(),
                            producto.getContenido(),
                            producto.getUnidadMedida().getId(),
                            null
                    );

            if (duplicado) {

                throw new BusinessException("Ya existe un producto con el mismo nombre, " 
                            + "marca, contenido y unidad de medida");
            }

            Long marcaId = producto.getMarcaProducto().getId();

            if (marcaProductoDAO.buscarPorId(marcaId) == null) {
                logger.warn("La marca con ID {} no existe", marcaId);
                throw new BusinessException("La marca indicada no existe");
            }

            Long categoriaId = producto.getCategoriaProducto().getId();

            if (categoriaProductoDAO.buscarPorId(categoriaId) == null) {
                logger.warn("La categoría con ID {} no existe", categoriaId );
                throw new BusinessException("La categoría indicada no existe");
            }

            Long unidadMedidaId = producto.getUnidadMedida().getId();

            if (unidadMedidaDAO.buscarPorId(unidadMedidaId) == null) {
                logger.warn("La unidad de medida con ID {} no existe", unidadMedidaId);
                throw new BusinessException("La unidad de medida indicada no existe");
            }

            Producto nuevoProducto = productoDAO.crear(producto);
            logger.info("Producto creado correctamente");
            return nuevoProducto;

        } catch (PersistenceException e) {
            logger.error( "Error al crear el producto", e);
            throw new ServiceException("Error al crear el producto", e);
        }
    }
    
    public void darDeBajaProducto(Long id) throws ServiceException, BusinessException {
        try {
            boolean exito = productoDAO.darDeBaja(id);
            if (!exito) {
                throw new BusinessException("No existe un producto con ID " + id);
            }
        } catch (PersistenceException e) {
            throw new ServiceException("Error al dar de baja el producto", e);
        }
    }

    public void reactivarProducto(Long id) throws ServiceException, BusinessException {
        try {
            boolean exito = productoDAO.reactivar(id);
            if (!exito) {
                throw new BusinessException("No existe un producto con ID " + id);
            }
        } catch (PersistenceException e) {
            throw new ServiceException("Error al reactivar el producto", e);
        }
    }

    // Actualiza los datos de un producto existente.
    public Producto actualizarProducto(Producto producto)
            throws ServiceException {

        logger.debug("Actualizando producto con ID {}", producto.getId());

        try {

            // Verificar que el producto exista.
            Producto existente = productoDAO.buscarPorId(producto.getId());

            if (existente == null) {

                throw new BusinessException("No existe un producto con ID " + producto.getId());
            }

            // Verificar producto duplicado.
            boolean duplicado =
                    productoDAO.existeProductoDuplicado(
                            producto.getNombre(),
                            producto.getMarcaProducto().getId(),
                            producto.getContenido(),
                            producto.getUnidadMedida().getId(),
                            producto.getId()
                    );

            if (duplicado) {

                throw new BusinessException("Ya existe otro producto con el mismo nombre, " 
                            + "marca, contenido y unidad de medida");
            }

            // Verificar que la marca exista.
            Long marcaId = producto.getMarcaProducto().getId();

            if (marcaProductoDAO.buscarPorId(marcaId) == null) {
                throw new BusinessException("La marca indicada no existe");
            }

            // Verificar que la categoría exista.
            Long categoriaId = producto.getCategoriaProducto().getId();

            if (categoriaProductoDAO.buscarPorId(categoriaId) == null) {
                throw new BusinessException("La categoría indicada no existe");
            }

            // Verificar que la unidad de medida exista.
            Long unidadMedidaId = producto.getUnidadMedida().getId();

            if (unidadMedidaDAO.buscarPorId(unidadMedidaId) == null) {

                throw new BusinessException("La unidad de medida indicada no existe");
            }

            Producto productoActualizado = productoDAO.actualizar(producto);

            logger.info("Producto actualizado correctamente");
            return productoActualizado;

        } catch (PersistenceException e) {
            logger.error("Error al actualizar el producto", e);
            throw new ServiceException("Error al actualizar el producto", e);
        }
    }
}