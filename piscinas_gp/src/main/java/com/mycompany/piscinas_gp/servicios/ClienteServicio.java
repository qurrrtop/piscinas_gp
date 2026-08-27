package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.daos.ClienteEmpresaDAO;
import com.mycompany.piscinas_gp.daos.ClienteParticularDAO;
import com.mycompany.piscinas_gp.daos.VentaDAO;
import com.mycompany.piscinas_gp.dtos.ClienteListadoDTO;
import com.mycompany.piscinas_gp.dtos.ClienteDetalleDTO;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.ClienteEmpresa;
import com.mycompany.piscinas_gp.modelos.ClienteParticular;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ClienteServicio {

    private static final Logger logger = LoggerFactory.getLogger(ClienteServicio.class);
    private final ClienteParticularDAO clienteParticularDAO;
    private final ClienteEmpresaDAO clienteEmpresaDAO;
    private final VentaDAO ventaDAO;

    public ClienteServicio(ClienteParticularDAO clienteParticularDAO, ClienteEmpresaDAO clienteEmpresaDAO, VentaDAO ventaDAO) {
        this.clienteParticularDAO = clienteParticularDAO;
        this.clienteEmpresaDAO = clienteEmpresaDAO;
        this.ventaDAO = ventaDAO;
    }
    
    public ClienteDetalleDTO buscarClientePorId(Long id) throws ServiceException {
        logger.debug("Buscando cliente con ID: {}", id);
        try {
            ClienteParticular particular = clienteParticularDAO.buscarPorId(id);
            
            if (particular != null) {
                ClienteDetalleDTO dto = new ClienteDetalleDTO();
                dto.setId(particular.getId());
                dto.setTipo("Particular");
                dto.setEmail(particular.getEmail());
                dto.setTelefono(particular.getTelefono());
                dto.setCalleYnumero(particular.getCalleYnumero());
                dto.setCiudad(particular.getCiudad());
                dto.setProvincia(particular.getProvincia());
                dto.setCodigoPostal(particular.getCodigoPostal());
                dto.setObservaciones(particular.getObservaciones());
                dto.setNombre(particular.getNombre());
                dto.setApellido(particular.getApellido());
                dto.setCuil(particular.getCuil());
                dto.setCantidadVentas(ventaDAO.contarVentasPorCliente(particular.getId()));
                return dto;
            }

            ClienteEmpresa empresa = clienteEmpresaDAO.buscarPorId(id);
            if (empresa != null) {
                ClienteDetalleDTO dto = new ClienteDetalleDTO();
                dto.setId(empresa.getId());
                dto.setTipo("Empresa");
                dto.setEmail(empresa.getEmail());
                dto.setTelefono(empresa.getTelefono());
                dto.setCalleYnumero(empresa.getCalleYnumero());
                dto.setCiudad(empresa.getCiudad());
                dto.setProvincia(empresa.getProvincia());
                dto.setCodigoPostal(empresa.getCodigoPostal());
                dto.setObservaciones(empresa.getObservaciones());
                dto.setRazonSocial(empresa.getRazonSocial());
                dto.setNombreFantasia(empresa.getNombreFantasia());
                dto.setRubro(empresa.getRubro());
                dto.setCuit(empresa.getCuit());
                dto.setCantidadVentas(ventaDAO.contarVentasPorCliente(empresa.getId()));
                return dto;
            }

            throw new BusinessException("No existe un cliente con ID " + id);

        } catch (PersistenceException e) {
            logger.error("Error al buscar el cliente con ID {}", id, e);
            throw new ServiceException("Error al buscar el cliente", e);
        }
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
}