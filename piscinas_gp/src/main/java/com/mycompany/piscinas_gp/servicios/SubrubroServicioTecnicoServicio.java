package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.daos.SubrubroServicioTecnicoDAO;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.SubrubroServicioTecnico;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SubrubroServicioTecnicoServicio {

    private static final Logger logger = LoggerFactory.getLogger(SubrubroServicioTecnicoServicio.class);

    private final SubrubroServicioTecnicoDAO subrubroDAO;

    public SubrubroServicioTecnicoServicio(SubrubroServicioTecnicoDAO subrubroDAO) {
        this.subrubroDAO = subrubroDAO;
    }

    public List<SubrubroServicioTecnico> buscarTodos() throws ServiceException {
        try {
            return subrubroDAO.buscarTodos();
        } catch (PersistenceException e) {
            logger.error("Error al recuperar los subrubros de servicio tecnico", e);
            throw new ServiceException("Error al recuperar los subrubros de servicio tecnico", e);
        }
    }
}