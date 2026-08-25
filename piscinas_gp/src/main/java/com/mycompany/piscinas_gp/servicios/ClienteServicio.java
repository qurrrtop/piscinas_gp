package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.daos.ClienteEmpresaDAO;
import com.mycompany.piscinas_gp.daos.ClienteParticularDAO;
import com.mycompany.piscinas_gp.daos.VentaDAO;
import com.mycompany.piscinas_gp.dtos.ClienteListadoDTO;
import com.mycompany.piscinas_gp.exceptions.AppException;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
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

    public List<ClienteListadoDTO> listarClientes() throws AppException {
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
            throw new AppException("Error al listar los clientes", e);
        }
    }
}