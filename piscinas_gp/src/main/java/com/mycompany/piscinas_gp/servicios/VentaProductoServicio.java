package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.daos.ClienteEmpresaDAO;
import com.mycompany.piscinas_gp.daos.ClienteParticularDAO;
import com.mycompany.piscinas_gp.daos.DetalleVentaDAO;
import com.mycompany.piscinas_gp.daos.EstadoVentaDAO;
import com.mycompany.piscinas_gp.daos.MetodoPagoDAO;
import com.mycompany.piscinas_gp.daos.ProductoDAO;
import com.mycompany.piscinas_gp.daos.VentaProductoDAO;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.Cliente;
import com.mycompany.piscinas_gp.modelos.ClienteEmpresa;
import com.mycompany.piscinas_gp.modelos.ClienteParticular;
import com.mycompany.piscinas_gp.modelos.DetalleVenta;
import com.mycompany.piscinas_gp.modelos.EstadoVenta;
import com.mycompany.piscinas_gp.modelos.MetodoPago;
import com.mycompany.piscinas_gp.modelos.Producto;
import com.mycompany.piscinas_gp.modelos.VentaProducto;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class VentaProductoServicio {
    
    private static final Logger logger = LoggerFactory.getLogger( VentaProductoServicio.class );
    
    private final VentaProductoDAO ventaProductoDAO;
    private final DetalleVentaDAO detalleVentaDAO;
    private final ProductoDAO productoDAO;
    private final ClienteParticularDAO clienteParticularDAO;
    private final ClienteEmpresaDAO clienteEmpresaDAO;
    private final EstadoVentaDAO estadoVentaDAO;
    private final MetodoPagoDAO metodopagoDAO;
    private final DbConnection dbConn;
    
    public VentaProductoServicio(
            VentaProductoDAO ventaProductoDAO1, 
            DetalleVentaDAO detalleVentaDAO1, 
            ProductoDAO productoDAO1, 
            ClienteParticularDAO clienteParticularDAO1, 
            ClienteEmpresaDAO clienteEmpresaDAO1, 
            EstadoVentaDAO estadoVentaDAO1, 
            MetodoPagoDAO metodoPagoDAO1
    ) {
        this.ventaProductoDAO = ventaProductoDAO1;
        this.detalleVentaDAO = detalleVentaDAO1;
        this.productoDAO = productoDAO1;
        this.clienteParticularDAO = clienteParticularDAO1;
        this.clienteEmpresaDAO = clienteEmpresaDAO1;
        this.estadoVentaDAO = estadoVentaDAO1;
        this.metodopagoDAO = metodoPagoDAO1;
        this.dbConn = DbConnection.getInstance();
    }
            
    public List<VentaProducto> listarVentas() throws ServiceException {
        return listarVentas(null, null, null, null);
    }
    
    public List<VentaProducto> listarVentas (
            String cliente,
            String estado,
            LocalDate fechaDesde,
            LocalDate fechaHasta
    ) throws ServiceException {
        
        logger.debug( "listando historial de ventas de productos" );
        
        try {
            return ventaProductoDAO.listarHistorial(
                    cliente, estado, fechaDesde, fechaHasta);
        } catch ( PersistenceException e ) {
            logger.error( "error al listar ventas de productos", e );
            throw new ServiceException("error al recuperar el historial de ventas", e);
        }
    }
    
    public VentaProducto buscarVentaPorId( Long id ) throws ServiceException, BusinessException {
        if ( id == null || id <= 0 ) {
            throw new BusinessException( "el id de la venta es invalido" );
        }
        
        logger.debug( "buscando venta de producto con id {}" );
        
        try {
            VentaProducto venta = ventaProductoDAO.buscarPorId(id);
            
            if (venta == null) {
                throw new BusinessException( "no existe una venta de producto con id " + id );
            }
            
            List<DetalleVenta> detalles = detalleVentaDAO.buscarPorVentaId(id);
            
            venta.setDetallesVenta(detalles);
            
            return venta;
            
        } catch ( PersistenceException e ) {
            logger.error("error al buscar la venta de producto con id {}", id, e);
            throw new ServiceException( "error al buscar la venta", e );
        }
    }
    
    public VentaProducto crearVenta(
            VentaProducto venta,
            Long clienteId,
            Long estadoVentaId,
            Long metodoPagoId
    ) throws ServiceException, BusinessException {
        
        logger.debug( "creando una venta de productos" );
        
        if ( venta == null ) {
            throw new BusinessException("la venta es requerida");
        }
        
        try {
            prepararVenta(
                    venta, clienteId, estadoVentaId, metodoPagoId, true,
                    Collections.emptyList()
            );

            VentaProducto ventaCreada = crearEnTransaccion(venta);

            logger.info("venta de producto creada correctamente con id {}", ventaCreada.getId());

            return ventaCreada;

        } catch (PersistenceException | SQLException e) {
            logger.error("error al crear la venta de producto", e);
            throw new ServiceException("error al crear la venta", e);
        }
        
    }
    
    public VentaProducto actualizarVenta(
            VentaProducto venta,
            Long clienteId,
            Long estadoVentaId,
            Long metodoPagoId
    ) throws ServiceException, BusinessException {

        if (venta == null || venta.getId() == null) {
            throw new BusinessException("El ID de la venta es requerido para actualizar");
        }

        logger.debug(
            "Actualizando venta de producto con ID {}", venta.getId());

        try {
            VentaProducto ventaExistente =
                buscarVentaPorId(venta.getId());

            prepararVenta(
                    venta, clienteId, estadoVentaId, metodoPagoId, false,
                    estaCerrada(ventaExistente)
                            ? ventaExistente.getDetallesVenta()
                            : Collections.emptyList()
            );

            VentaProducto ventaActualizada = actualizarEnTransaccion(
                    venta,
                    ventaExistente
            );

            logger.info(
                "Venta de producto actualizada correctamente con ID {}",
                ventaActualizada.getId()
            );

            return ventaActualizada;
            
        } catch (PersistenceException | SQLException e) {
            logger.error(
                "Error al actualizar la venta de producto con ID {}",
                venta.getId(), e
            );
            throw new ServiceException("Error al actualizar la venta", e);
        }
    }
        
    public VentaProducto cancelarVenta( Long ventaId ) throws ServiceException, BusinessException {
            
        logger.debug("cancelando venta de producto con id {}", ventaId);
            
        try {
            VentaProducto venta = buscarVentaPorId(ventaId);
                
            if ( "cancelada".equalsIgnoreCase(venta.getEstadoVenta().getNombre()) ) {
                throw new BusinessException("la venta ya esta cancelada");
            }
                
            EstadoVenta estadoCancelada = estadoVentaDAO.buscarPorNombre("cancelada");
                
            if ( estadoCancelada == null ) {
                throw new BusinessException("no existe el estado de venta 'cancelada'");
            }
                
            VentaProducto ventaCancelada = cancelarEnTransaccion(
                    venta, estadoCancelada
            );
                
            logger.info("venta de producto cancelada correctamente con id {}", ventaId);
            
            return ventaCancelada;
                
        } catch (PersistenceException | SQLException e) {
            logger.error(
                    "Error al cancelar la venta de producto con ID {}",
                    ventaId, e
            );
            throw new ServiceException("Error al cancelar la venta", e);
        }
    }
        
    private void prepararVenta( 
            VentaProducto venta,
            Long clienteId,
            Long estadoVentaId,
            Long metodoPagoId,
            boolean esNueva,
            List<DetalleVenta> detallesStockAReponer
    ) throws PersistenceException, BusinessException {
            
        Cliente cliente = buscarClienteReal(clienteId);
        EstadoVenta estadoVenta = resolverEstadoVenta(estadoVentaId);
        MetodoPago metodoPago = resolverMetodoPago(metodoPagoId);
            
        if ( esNueva && "cancelada".equalsIgnoreCase(estadoVenta.getNombre()) ) {
            throw new BusinessException("no se puede crear una venta con estado cancelada");
        }
            
        venta.setCliente(cliente);
        venta.setEstadoVenta(estadoVenta);
        venta.setMetodoPago(metodoPago);
            
        validarYPrepararDetalles(
                venta.getDetallesVenta(), detallesStockAReponer
        );
            
        BigDecimal total = calcularTotal( venta.getDetallesVenta(), venta.getDescuentoGlobal());
            
        venta.setTotal(total);
    }
        
    private Cliente buscarClienteReal( Long clienteId ) throws PersistenceException, BusinessException {
            
        if ( clienteId == null || clienteId <= 0 ) {
            throw new BusinessException("el cliente es requerido");
        }
            
        ClienteParticular particular = clienteParticularDAO.buscarPorId(clienteId);
            
        if ( particular != null ) {
            return particular;
        }
            
        ClienteEmpresa empresa = clienteEmpresaDAO.buscarPorId(clienteId);
            
        if ( empresa != null ) {
                return empresa;
        }
            
        throw new BusinessException("no existe un cliente con id "+ clienteId);     
    }
        
    private EstadoVenta resolverEstadoVenta( Long estadoVentaId ) throws PersistenceException, BusinessException {
        
        if ( estadoVentaId == null || estadoVentaId <= 0 ) {
            throw new BusinessException("el estado de venta es requerido");
        }
            
        EstadoVenta estadoVenta = estadoVentaDAO.buscarPorId(estadoVentaId);
            
        if ( estadoVenta == null ) {
            throw new BusinessException("no existe el estado de venta indicado");
        }
            
        return estadoVenta;
    }
        
    private MetodoPago resolverMetodoPago(Long metodoPagoId) throws PersistenceException, BusinessException {

        if (metodoPagoId == null || metodoPagoId <= 0) {
            throw new BusinessException("El método de pago es requerido");
        }

        MetodoPago metodoPago =
            metodopagoDAO.buscarPorId(metodoPagoId);

        if (metodoPago == null) {
            throw new BusinessException(
                "No existe el método de pago indicado");
        }

        return metodoPago;
    }
        
    private void validarYPrepararDetalles(
            List<DetalleVenta> detalles,
            List<DetalleVenta> detallesStockAReponer
    ) throws PersistenceException, BusinessException {

        if (detalles == null || detalles.isEmpty()) {
            throw new BusinessException(
                    "la venta debe tener al menos un producto");
        }

        Map<Long, Integer> cantidadesPorProducto =
                agruparCantidades(detalles);

        // Cuando se edita una venta ya cerrada, su stock anterior se repone
        // dentro de la transaccion antes de descontar el detalle nuevo.
        Map<Long, Integer> cantidadesAReponer =
                agruparCantidades(detallesStockAReponer);

        Map<Long, Producto> productosReales = new HashMap<>();

        for (Map.Entry<Long, Integer> entrada
                : cantidadesPorProducto.entrySet()) {

            Long productoId = entrada.getKey();
            int cantidadSolicitada = entrada.getValue();

            Producto producto = productoDAO.buscarPorId(productoId);

            if (producto == null) {
                throw new BusinessException(
                        "no existe el producto con id " + productoId);
            }

            if (!producto.isActivo()) {
                throw new BusinessException(
                        "el producto " + producto.getNombre()
                        + " se encuentra inactivo");
            }

            int stockDisponible = producto.getStock()
                    + cantidadesAReponer.getOrDefault(productoId, 0);

            if (stockDisponible < cantidadSolicitada) {
                throw new BusinessException(
                        "stock insuficiente para el producto "
                        + producto.getNombre() + ". disponible: "
                        + stockDisponible);
            }

            productosReales.put(productoId, producto);
        }

        for (DetalleVenta detalle : detalles) {
            Producto productoReal = productosReales.get(
                    detalle.getProducto().getId());

            detalle.setProducto(productoReal);

            // El precio se toma de la base para evitar modificar el importe
            // desde el JSON enviado por el cliente.
            detalle.setPrecioUnitario(productoReal.getPrecioActual());
        }
    }

    private Map<Long, Integer> agruparCantidades(
            List<DetalleVenta> detalles
    ) throws BusinessException {

        Map<Long, Integer> cantidades = new HashMap<>();

        if (detalles == null) {
            return cantidades;
        }

        for (DetalleVenta detalle : detalles) {
            if (detalle == null || detalle.getProducto() == null
                    || detalle.getProducto().getId() == null) {
                throw new BusinessException(
                        "todos los detalles deben indicar un producto");
            }

            cantidades.merge(
                    detalle.getProducto().getId(),
                    detalle.getCantidad(),
                    Integer::sum
            );
        }

        return cantidades;
    }
        
    private BigDecimal calcularTotal( List<DetalleVenta> detalles, int descuentoGlobal ) {
        BigDecimal subtotal = BigDecimal.ZERO;
            
        for ( DetalleVenta detalle : detalles ) {
            BigDecimal subtotalDetalle = detalle.getPrecioUnitario().multiply(BigDecimal.valueOf(detalle.getCantidad()));
            
            subtotal = subtotal.add(subtotalDetalle);
        }
            
        BigDecimal descuento = subtotal.multiply(BigDecimal.valueOf(descuentoGlobal)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            
        return subtotal.subtract(descuento).setScale(2, RoundingMode.HALF_UP);
    }
        
    private VentaProducto crearEnTransaccion(VentaProducto venta)
            throws PersistenceException, BusinessException, SQLException {

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                VentaProducto ventaCreada = ventaProductoDAO.crear(venta, conn);

                for (DetalleVenta detalle : venta.getDetallesVenta()) {
                    detalleVentaDAO.crear(detalle, ventaCreada.getId(), conn);
                }

                if (estaCerrada(ventaCreada)) {
                    descontarStockDeDetalles(ventaCreada.getDetallesVenta(), conn);
                }

                ventaCreada.setDetallesVenta(venta.getDetallesVenta());
                conn.commit();

                return ventaCreada;

            } catch (PersistenceException | BusinessException | SQLException | RuntimeException e) {
                rollbackTransaccion(conn);
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private VentaProducto actualizarEnTransaccion(
            VentaProducto venta, VentaProducto ventaExistente
    ) throws PersistenceException, BusinessException, SQLException {

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                if (estaCerrada(ventaExistente)) {
                    reponerStockDeDetalles(
                            ventaExistente.getDetallesVenta(), conn
                    );
                }

                VentaProducto ventaActualizada =
                        ventaProductoDAO.actualizar(venta, conn);

                sincronizarDetalles(
                        ventaExistente.getDetallesVenta(),
                        venta.getDetallesVenta(),
                        venta.getId(),
                        conn
                );

                if (estaCerrada(ventaActualizada)) {
                    descontarStockDeDetalles(
                            ventaActualizada.getDetallesVenta(), conn
                    );
                }

                ventaActualizada.setDetallesVenta(venta.getDetallesVenta());
                conn.commit();

                return ventaActualizada;

            } catch (PersistenceException | BusinessException | SQLException | RuntimeException e) {
                rollbackTransaccion(conn);
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private VentaProducto cancelarEnTransaccion(
            VentaProducto venta, EstadoVenta estadoCancelada
    ) throws PersistenceException, BusinessException, SQLException {

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                if (estaCerrada(venta)) {
                    reponerStockDeDetalles(venta.getDetallesVenta(), conn);
                }

                venta.setEstadoVenta(estadoCancelada);
                venta.setFechaCierre(LocalDate.now());

                VentaProducto ventaCancelada =
                        ventaProductoDAO.actualizar(venta, conn);

                ventaCancelada.setDetallesVenta(venta.getDetallesVenta());
                conn.commit();

                return ventaCancelada;

            } catch (PersistenceException | BusinessException | SQLException | RuntimeException e) {
                rollbackTransaccion(conn);
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private boolean estaCerrada(VentaProducto venta) {
        return venta != null
                && venta.getEstadoVenta() != null
                && "cerrada".equalsIgnoreCase(
                        venta.getEstadoVenta().getNombre());
    }

    private void descontarStockDeDetalles(
            List<DetalleVenta> detalles, Connection conn
    ) throws PersistenceException, BusinessException {

        for (Map.Entry<Long, Integer> entrada
                : agruparCantidades(detalles).entrySet()) {
            productoDAO.descontarStock(
                    entrada.getKey(), entrada.getValue(), conn
            );
        }
    }

    private void reponerStockDeDetalles(
            List<DetalleVenta> detalles, Connection conn
    ) throws PersistenceException, BusinessException {

        for (Map.Entry<Long, Integer> entrada
                : agruparCantidades(detalles).entrySet()) {
            productoDAO.reponerStock(
                    entrada.getKey(), entrada.getValue(), conn
            );
        }
    }

    private void rollbackTransaccion(Connection conn) {
        try {
            conn.rollback();
        } catch (SQLException e) {
            logger.error("No se pudo revertir la transaccion de venta", e);
        }
    }

    private void sincronizarDetalles(
            List<DetalleVenta> detallesAnteriores,
            List<DetalleVenta> detallesNuevos,
            Long ventaId,
            Connection conn
    ) throws PersistenceException, BusinessException {
            
            Map<Long, DetalleVenta> anterioresPorId = new HashMap<>();
            
            for ( DetalleVenta detalleAnterior : detallesAnteriores ) {
                anterioresPorId.put(detalleAnterior.getId(), detalleAnterior);
            }
            
            Set<Long> idsRecibidos = new HashSet<>();
            
        for ( DetalleVenta detalleNuevo : detallesNuevos ) {
            if ( detalleNuevo.getId() == null ) {
                detalleVentaDAO.crear(detalleNuevo, ventaId, conn);
                continue;
            }
                
            if ( !anterioresPorId.containsKey(detalleNuevo.getId()) ) {
                throw new BusinessException("el detalle con id "+ detalleNuevo.getId() + " no pertenece a esta venta");
            }
                
            detalleVentaDAO.actualizar(detalleNuevo, conn);
            idsRecibidos.add(detalleNuevo.getId());
        }
            
        for ( Long idDetalleAnterior : anterioresPorId.keySet() ) {
            if ( !idsRecibidos.contains(idDetalleAnterior) ) {
                detalleVentaDAO.eliminarPorId(idDetalleAnterior, conn);
            }
        }
    }
        
        
        
        
}
