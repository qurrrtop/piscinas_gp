package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.daos.MarcaProductoDAO;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.MarcaProducto;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MarcaProductoServicio {

    private static final Logger logger = LoggerFactory.getLogger(MarcaProductoServicio.class);

    private final MarcaProductoDAO marcaProductoDAO;

    public MarcaProductoServicio(MarcaProductoDAO marcaProductoDAO) {
        this.marcaProductoDAO = marcaProductoDAO;
    }

    public MarcaProducto buscarPorId(Long id) throws ServiceException {
        try {
            MarcaProducto marca = marcaProductoDAO.buscarPorId(id);
            if (marca == null) {
                throw new BusinessException("No existe una marca con ID " + id);
            }
            return marca;
        } catch (PersistenceException e) {
            logger.error("Error al buscar la marca con ID {}", id, e);
            throw new ServiceException("Error al buscar la marca", e);
        }
    }

    public List<MarcaProducto> buscarTodas() throws ServiceException {
        try {
            return marcaProductoDAO.buscarTodos();
        } catch (PersistenceException e) {
            logger.error("Error al recuperar las marcas", e);
            throw new ServiceException("Error al recuperar las marcas", e);
        }
    }

    /** Para poblar selects de alta (formulario de producto, importador): solo activas. */
    public List<MarcaProducto> buscarActivas() throws ServiceException {
        try {
            return marcaProductoDAO.buscarActivas();
        } catch (PersistenceException e) {
            logger.error("Error al recuperar las marcas activas", e);
            throw new ServiceException("Error al recuperar las marcas activas", e);
        }
    }

    public MarcaProducto crearMarca(MarcaProducto marca) throws ServiceException {
        try {
            if (marcaProductoDAO.checkExistenceByField("nombre", marca.getNombre())) {
                throw new BusinessException("Ya existe una marca con el nombre " + marca.getNombre());
            }
            return marcaProductoDAO.crear(marca);
        } catch (PersistenceException e) {
            logger.error("Error al crear la marca", e);
            throw new ServiceException("Error al crear la marca", e);
        }
    }

    public MarcaProducto actualizarMarca(MarcaProducto marca) throws ServiceException {
        try {
            MarcaProducto existente = marcaProductoDAO.buscarPorId(marca.getId());
            if (existente == null) {
                throw new BusinessException("No existe una marca con ID " + marca.getId());
            }
            return marcaProductoDAO.actualizar(marca);
        } catch (PersistenceException e) {
            logger.error("Error al actualizar la marca con ID {}", marca.getId(), e);
            throw new ServiceException("Error al actualizar la marca", e);
        }
    }

    public void darDeBajaMarca(Long id) throws ServiceException {
        MarcaProducto marca = buscarPorId(id); // ya valida que exista y tira BusinessException si no
        marca.setActivo(false);
        actualizarMarca(marca);
    }

    public void reactivarMarca(Long id) throws ServiceException {
        MarcaProducto marca = buscarPorId(id);
        marca.setActivo(true);
        actualizarMarca(marca);
    }
}