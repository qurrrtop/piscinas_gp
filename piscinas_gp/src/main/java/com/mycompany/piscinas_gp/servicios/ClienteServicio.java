package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.daos.ClienteEmpresaDAO;
import com.mycompany.piscinas_gp.daos.ClienteParticularDAO;
import com.mycompany.piscinas_gp.daos.LocalidadDAO;
import com.mycompany.piscinas_gp.daos.VentaDAO;
import com.mycompany.piscinas_gp.daos.HelperClienteDAO;
import com.mycompany.piscinas_gp.dtos.ClienteDTO;
import com.mycompany.piscinas_gp.dtos.ClienteDetalleDTO;
import com.mycompany.piscinas_gp.dtos.ClienteListadoDTO;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.ClienteEmpresa;
import com.mycompany.piscinas_gp.modelos.ClienteParticular;
import com.mycompany.piscinas_gp.modelos.Localidad;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ClienteServicio {

    private static final Logger logger = LoggerFactory.getLogger(ClienteServicio.class);
    private final ClienteParticularDAO clienteParticularDAO;
    private final ClienteEmpresaDAO clienteEmpresaDAO;
    private final VentaDAO ventaDAO;
    private final HelperClienteDAO helperClienteDAO;
    private final LocalidadDAO localidadDAO;

    public ClienteServicio(ClienteParticularDAO clienteParticularDAO, ClienteEmpresaDAO clienteEmpresaDAO,
            VentaDAO ventaDAO, HelperClienteDAO helperClienteDAO, LocalidadDAO localidadDAO) {
        this.clienteParticularDAO = clienteParticularDAO;
        this.clienteEmpresaDAO = clienteEmpresaDAO;
        this.ventaDAO = ventaDAO;
        this.helperClienteDAO = helperClienteDAO;
        this.localidadDAO = localidadDAO;
    }

    public List<ClienteListadoDTO> listarClientes() throws ServiceException {
        logger.debug("Listando todos los clientes");
        try {
            List<ClienteListadoDTO> resultado = new ArrayList<>();

            for (ClienteParticular cp : clienteParticularDAO.buscarTodos()) {
                int ventas = ventaDAO.contarVentasPorCliente(cp.getId());
                resultado.add(new ClienteListadoDTO(
                        cp.getId(),
                        cp.getNombre() + " " + cp.getApellido(),
                        "Particular",
                        cp.getCuil(),
                        cp.getTelefono(),
                        cp.getEmail(),
                        cp.isActivo(),
                        ventas
                ));
            }

            for (ClienteEmpresa ce : clienteEmpresaDAO.buscarTodos()) {
                int ventas = ventaDAO.contarVentasPorCliente(ce.getId());
                resultado.add(new ClienteListadoDTO(
                        ce.getId(),
                        ce.getRazonSocial(),
                        "Empresa",
                        ce.getCuit(),
                        ce.getTelefono(),
                        ce.getEmail(),
                        ce.isActivo(),
                        ventas
                ));
            }

            logger.info("Se listaron {} clientes en total", resultado.size());
            return resultado;

        } catch (PersistenceException e) {
            logger.error("Error al listar los clientes", e);
            throw new ServiceException("Error al listar los clientes", e);
        }
    }

    public ClienteDetalleDTO buscarClientePorId(Long id) throws ServiceException, BusinessException {
        logger.debug("Buscando cliente con ID: {}", id);
        try {
            ClienteParticular particular = clienteParticularDAO.buscarPorId(id);
            if (particular != null) {
                return mapearADetalle(particular);
            }

            ClienteEmpresa empresa = clienteEmpresaDAO.buscarPorId(id);
            if (empresa != null) {
                return mapearADetalle(empresa);
            }

            throw new BusinessException("No existe un cliente con ID " + id);

        } catch (PersistenceException e) {
            logger.error("Error al buscar el cliente con ID {}", id, e);
            throw new ServiceException("Error al buscar el cliente", e);
        }
    }

    public ClienteDetalleDTO crearCliente(ClienteDTO dto) throws ServiceException, BusinessException {
        logger.debug("Creando cliente de tipo {}", dto.getTipo());
        try {
            Localidad localidad = resolverLocalidad(dto.getLocalidadId());

            if ("Particular".equalsIgnoreCase(dto.getTipo())) {
                ClienteParticular nuevo = new ClienteParticular(
                        dto.getNombre(),
                        dto.getApellido(),
                        dto.getCuil(),
                        dto.getEmail(),
                        dto.getTelefono(),
                        dto.getCalleYnumero(),
                        localidad,
                        dto.getObservaciones(),
                        dto.isActivo()
                );
                ClienteParticular creado = clienteParticularDAO.crear(nuevo);
                logger.info("Cliente particular creado correctamente");
                return mapearADetalle(creado);

            } else if ("Empresa".equalsIgnoreCase(dto.getTipo())) {
                ClienteEmpresa nuevo = new ClienteEmpresa(
                        dto.getRazonSocial(),
                        dto.getNombreFantasia(),
                        dto.getRubro(),
                        dto.getCuit(),
                        dto.getEmail(),
                        dto.getTelefono(),
                        dto.getCalleYnumero(),
                        localidad,
                        dto.getObservaciones(),
                        dto.isActivo()
                );
                ClienteEmpresa creado = clienteEmpresaDAO.crear(nuevo);
                logger.info("Cliente empresa creado correctamente");
                return mapearADetalle(creado);

            } else {
                throw new BusinessException("El tipo de cliente debe ser 'Particular' o 'Empresa'");
            }

        } catch (PersistenceException e) {
            logger.error("Error al crear el cliente", e);
            throw new ServiceException("Error al crear el cliente", e);
        }
    }

    public ClienteDetalleDTO actualizarCliente(ClienteDTO dto) throws ServiceException, BusinessException {
        logger.debug("Actualizando cliente con ID {}", dto.getId());

        if (dto.getId() == null) {
            throw new BusinessException("El ID del cliente es requerido para actualizar");
        }

        try {
            Localidad localidad = resolverLocalidad(dto.getLocalidadId());

            if ("Particular".equalsIgnoreCase(dto.getTipo())) {
                ClienteParticular actualizado = new ClienteParticular(
                        dto.getId(),
                        dto.getNombre(),
                        dto.getApellido(),
                        dto.getCuil(),
                        dto.getEmail(),
                        dto.getTelefono(),
                        dto.getCalleYnumero(),
                        localidad,
                        dto.getObservaciones(),
                        dto.isActivo()
                );
                ClienteParticular guardado = clienteParticularDAO.actualizar(actualizado);
                logger.info("Cliente particular actualizado correctamente");
                return mapearADetalle(guardado);

            } else if ("Empresa".equalsIgnoreCase(dto.getTipo())) {
                ClienteEmpresa actualizado = new ClienteEmpresa(
                        dto.getId(),
                        dto.getRazonSocial(),
                        dto.getNombreFantasia(),
                        dto.getRubro(),
                        dto.getCuit(),
                        dto.getEmail(),
                        dto.getTelefono(),
                        dto.getCalleYnumero(),
                        localidad,
                        dto.getObservaciones(),
                        dto.isActivo()
                );
                ClienteEmpresa guardado = clienteEmpresaDAO.actualizar(actualizado);
                logger.info("Cliente empresa actualizado correctamente");
                return mapearADetalle(guardado);

            } else {
                throw new BusinessException("El tipo de cliente debe ser 'Particular' o 'Empresa'");
            }

        } catch (PersistenceException e) {
            logger.error("Error al actualizar el cliente con ID {}", dto.getId(), e);
            throw new ServiceException("Error al actualizar el cliente", e);
        }
    }

    public void darDeBajaCliente(Long id) throws ServiceException, BusinessException {
        try {
            boolean exito = helperClienteDAO.darDeBaja(id);
            if (!exito) {
                throw new BusinessException("No existe un cliente con ID " + id);
            }
        } catch (PersistenceException e) {
            throw new ServiceException("Error al dar de baja el cliente", e);
        }
    }

    public void reactivarCliente(Long id) throws ServiceException, BusinessException {
        try {
            boolean exito = helperClienteDAO.reactivar(id);
            if (!exito) {
                throw new BusinessException("No existe un cliente con ID " + id);
            }
        } catch (PersistenceException e) {
            throw new ServiceException("Error al reactivar el cliente", e);
        }
    }
    
    // Busca la Localidad real a partir del ID que manda el DTO, validando que exista
    private Localidad resolverLocalidad(Long localidadId) throws PersistenceException, BusinessException {
        if (localidadId == null) {
            throw new BusinessException("La localidad es requerida");
        }
        Localidad localidad = localidadDAO.buscarPorId(localidadId);
        
        if (localidad == null) {
            throw new BusinessException("La localidad indicada no existe");
        }
        return localidad;
    }

    private ClienteDetalleDTO mapearADetalle(ClienteParticular c) throws PersistenceException {
        ClienteDetalleDTO dto = new ClienteDetalleDTO();
        dto.setId(c.getId());
        dto.setTipo("Particular");
        dto.setEmail(c.getEmail());
        dto.setTelefono(c.getTelefono());
        dto.setCalleYnumero(c.getCalleYnumero());
        dto.setLocalidadId(c.getLocalidad().getId());
        dto.setLocalidadNombre(c.getLocalidad().getNombre());
        dto.setObservaciones(c.getObservaciones());
        dto.setActivo(c.isActivo());
        dto.setNombre(c.getNombre());
        dto.setApellido(c.getApellido());
        dto.setCuil(c.getCuil());
        dto.setCantidadVentas(ventaDAO.contarVentasPorCliente(c.getId()));
        return dto;
    }

    private ClienteDetalleDTO mapearADetalle(ClienteEmpresa c) throws PersistenceException {
        ClienteDetalleDTO dto = new ClienteDetalleDTO();
        dto.setId(c.getId());
        dto.setTipo("Empresa");
        dto.setEmail(c.getEmail());
        dto.setTelefono(c.getTelefono());
        dto.setCalleYnumero(c.getCalleYnumero());
        dto.setLocalidadId(c.getLocalidad().getId());
        dto.setLocalidadNombre(c.getLocalidad().getNombre());
        dto.setObservaciones(c.getObservaciones());
        dto.setActivo(c.isActivo());
        dto.setRazonSocial(c.getRazonSocial());
        dto.setNombreFantasia(c.getNombreFantasia());
        dto.setRubro(c.getRubro());
        dto.setCuit(c.getCuit());
        dto.setCantidadVentas(ventaDAO.contarVentasPorCliente(c.getId()));
        return dto;
    }
}