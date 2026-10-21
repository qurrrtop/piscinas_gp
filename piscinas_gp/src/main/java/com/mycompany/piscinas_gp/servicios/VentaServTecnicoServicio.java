package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.ClienteEmpresaDAO;
import com.mycompany.piscinas_gp.daos.ClienteParticularDAO;
import com.mycompany.piscinas_gp.daos.DetalleVentaDAO;
import com.mycompany.piscinas_gp.daos.EstadoVentaDAO;
import com.mycompany.piscinas_gp.daos.ImagenVentaDAO;
import com.mycompany.piscinas_gp.daos.MetodoPagoDAO;
import com.mycompany.piscinas_gp.daos.ProductoDAO;
import com.mycompany.piscinas_gp.daos.SubrubroServicioTecnicoDAO;
import com.mycompany.piscinas_gp.daos.VentaServTecnicoDAO;
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
import com.mycompany.piscinas_gp.modelos.SubrubroServicioTecnico;
import com.mycompany.piscinas_gp.modelos.VentaServTecnico;
import com.mycompany.piscinas_gp.utils.AlmacenImagenes;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class VentaServTecnicoServicio {

    private static final Logger logger = LoggerFactory.getLogger(VentaServTecnicoServicio.class);

    // Regla de negocio: el modulo de servicios solo muestra los servicios ya resueltos
    // (completados y cancelados). Los pendientes se ven en el modulo de pendientes.
    private static final List<String> ESTADOS_HISTORIAL = List.of("cerrada", "cancelada");
    private static final List<String> ESTADOS_PENDIENTES = List.of("pendiente");

    private static final int MAX_IMAGENES_EVIDENCIA = 5;

    private final VentaServTecnicoDAO ventaServTecnicoDAO;
    private final DetalleVentaDAO detalleVentaDAO;
    private final ProductoDAO productoDAO;
    private final SubrubroServicioTecnicoDAO subrubroServicioTecnicoDAO;
    private final ClienteParticularDAO clienteParticularDAO;
    private final ClienteEmpresaDAO clienteEmpresaDAO;
    private final EstadoVentaDAO estadoVentaDAO;
    private final MetodoPagoDAO metodoPagoDAO;
    private final ImagenVentaDAO imagenVentaDAO;
    private final DbConnection dbConn;

    public VentaServTecnicoServicio(
            VentaServTecnicoDAO ventaServTecnicoDAO,
            DetalleVentaDAO detalleVentaDAO,
            ProductoDAO productoDAO,
            SubrubroServicioTecnicoDAO subrubroServicioTecnicoDAO,
            ClienteParticularDAO clienteParticularDAO,
            ClienteEmpresaDAO clienteEmpresaDAO,
            EstadoVentaDAO estadoVentaDAO,
            MetodoPagoDAO metodoPagoDAO,
            ImagenVentaDAO imagenVentaDAO
    ) {
        this.ventaServTecnicoDAO = ventaServTecnicoDAO;
        this.detalleVentaDAO = detalleVentaDAO;
        this.productoDAO = productoDAO;
        this.subrubroServicioTecnicoDAO = subrubroServicioTecnicoDAO;
        this.clienteParticularDAO = clienteParticularDAO;
        this.clienteEmpresaDAO = clienteEmpresaDAO;
        this.estadoVentaDAO = estadoVentaDAO;
        this.metodoPagoDAO = metodoPagoDAO;
        this.imagenVentaDAO = imagenVentaDAO;
        this.dbConn = DbConnection.getInstance();
    }

    public List<VentaServTecnico> listarServicios() throws ServiceException {
        try {
            return ventaServTecnicoDAO.buscarTodos();
        } catch (PersistenceException e) {
            logger.error("Error al listar servicios tecnicos", e);
            throw new ServiceException("Error al recuperar el historial de servicios tecnicos", e);
        }
    }

    // El listado no carga repuestos ni imagenes; eso se ve en el detalle (buscarServicioPorId)
    public List<VentaServTecnico> listarHistorial() throws ServiceException {
        try {
            return ventaServTecnicoDAO.buscarPorEstados(ESTADOS_HISTORIAL);
        } catch (PersistenceException e) {
            logger.error("Error al listar el historial de servicios tecnicos", e);
            throw new ServiceException("Error al recuperar el historial de servicios tecnicos", e);
        }
    }

    public List<VentaServTecnico> listarPendientes() throws ServiceException {
        try {
            return ventaServTecnicoDAO.buscarPorEstados(ESTADOS_PENDIENTES);
        } catch (PersistenceException e) {
            logger.error("Error al listar los servicios tecnicos pendientes", e);
            throw new ServiceException("Error al recuperar los servicios tecnicos pendientes", e);
        }
    }

    public VentaServTecnico buscarServicioPorId(Long id) throws ServiceException, BusinessException {
        if (id == null || id <= 0) {
            throw new BusinessException("El id del servicio es invalido");
        }

        try {
            VentaServTecnico servicio = ventaServTecnicoDAO.buscarPorId(id);

            if (servicio == null) {
                throw new BusinessException("No existe un servicio tecnico con id " + id);
            }

            List<DetalleVenta> detalles = detalleVentaDAO.buscarPorVentaId(id);
            servicio.setDetallesVenta(detalles);
            servicio.setImagenesEvidencia(imagenVentaDAO.buscarPorVentaId(id));

            return servicio;

        } catch (PersistenceException e) {
            logger.error("Error al buscar el servicio tecnico con id {}", id, e);
            throw new ServiceException("Error al buscar el servicio", e);
        }
    }

    public VentaServTecnico crearServicio(
            VentaServTecnico servicio,
            Long clienteId,
            Long estadoVentaId,
            Long metodoPagoId,
            Long subrubroServicioId
    ) throws ServiceException, BusinessException {

        if (servicio == null) {
            throw new BusinessException("El servicio es requerido");
        }

        try {
            prepararServicio(
                    servicio, clienteId, estadoVentaId, metodoPagoId, subrubroServicioId,
                    true, Collections.emptyList()
            );

            VentaServTecnico servicioCreado = crearEnTransaccion(servicio);

            logger.info("Servicio tecnico creado correctamente con id {}", servicioCreado.getId());

            return servicioCreado;

        } catch (PersistenceException | SQLException e) {
            logger.error("Error al crear el servicio tecnico", e);
            throw new ServiceException("Error al crear el servicio", e);
        }
    }

    public VentaServTecnico actualizarServicio(
            VentaServTecnico servicio,
            Long clienteId,
            Long estadoVentaId,
            Long metodoPagoId,
            Long subrubroServicioId
    ) throws ServiceException, BusinessException {

        if (servicio == null || servicio.getId() == null) {
            throw new BusinessException("El ID del servicio es requerido para actualizar");
        }

        try {
            VentaServTecnico servicioExistente = buscarServicioPorId(servicio.getId());

            if (estaCancelada(servicioExistente)) {
                throw new BusinessException("No se puede editar un servicio cancelado");
            }

            prepararServicio(
                    servicio, clienteId, estadoVentaId, metodoPagoId, subrubroServicioId, false,
                    !estaCancelada(servicioExistente)
                            ? servicioExistente.getDetallesVenta()
                            : Collections.emptyList()
            );

            VentaServTecnico servicioActualizado = actualizarEnTransaccion(servicio, servicioExistente);

            // recien con el guardado confirmado se borran del disco las imagenes que se quitaron
            borrarImagenesQuitadas(servicioExistente.getImagenesEvidencia(), servicio.getImagenesEvidencia());

            logger.info("Servicio tecnico actualizado correctamente con id {}", servicioActualizado.getId());

            return servicioActualizado;

        } catch (PersistenceException | SQLException e) {
            logger.error("Error al actualizar el servicio tecnico con id {}", servicio.getId(), e);
            throw new ServiceException("Error al actualizar el servicio", e);
        }
    }

    public VentaServTecnico cancelarServicio(Long servicioId) throws ServiceException, BusinessException {
        try {
            VentaServTecnico servicio = buscarServicioPorId(servicioId);

            if ("cancelada".equalsIgnoreCase(servicio.getEstadoVenta().getNombre())) {
                throw new BusinessException("El servicio ya esta cancelado");
            }

            EstadoVenta estadoCancelada = estadoVentaDAO.buscarPorNombre("cancelada");

            if (estadoCancelada == null) {
                throw new BusinessException("No existe el estado de venta 'cancelada'");
            }

            VentaServTecnico servicioCancelado = cambiarEstadoEnTransaccion(
                    servicio, estadoCancelada, true
            );

            logger.info("Servicio tecnico cancelado correctamente con id {}", servicioId);

            return servicioCancelado;

        } catch (PersistenceException | SQLException e) {
            logger.error("Error al cancelar el servicio tecnico con id {}", servicioId, e);
            throw new ServiceException("Error al cancelar el servicio", e);
        }
    }

    public VentaServTecnico cerrarServicio(Long servicioId) throws ServiceException, BusinessException {
        try {
            VentaServTecnico servicio = buscarServicioPorId(servicioId);

            if (estaCancelada(servicio)) {
                throw new BusinessException("No se puede cerrar un servicio cancelado");
            }
            if ("cerrada".equalsIgnoreCase(servicio.getEstadoVenta().getNombre())) {
                throw new BusinessException("El servicio ya esta cerrado");
            }

            // Regla de negocio: la recomendacion es obligatoria recien al cerrar el servicio.
            if (servicio.getDiagnostico() == null || servicio.getDiagnostico().isBlank()) {
                throw new BusinessException("Debe cargar una recomendacion antes de cerrar el servicio");
            }

            EstadoVenta estadoCerrada = estadoVentaDAO.buscarPorNombre("cerrada");

            if (estadoCerrada == null) {
                throw new BusinessException("No existe el estado de venta 'cerrada'");
            }

            VentaServTecnico servicioCerrado = cambiarEstadoEnTransaccion(
                    servicio, estadoCerrada, false
            );

            logger.info("Servicio tecnico cerrado correctamente con id {}", servicioId);

            return servicioCerrado;

        } catch (PersistenceException | SQLException e) {
            logger.error("Error al cerrar el servicio tecnico con id {}", servicioId, e);
            throw new ServiceException("Error al cerrar el servicio", e);
        }
    }

    private void prepararServicio(
            VentaServTecnico servicio,
            Long clienteId,
            Long estadoVentaId,
            Long metodoPagoId,
            Long subrubroServicioId,
            boolean esNuevo,
            List<DetalleVenta> detallesStockAReponer
    ) throws PersistenceException, BusinessException {

        validarImagenes(servicio.getImagenesEvidencia());

        Cliente cliente = buscarClienteReal(clienteId);
        EstadoVenta estadoVenta = resolverEstadoVenta(estadoVentaId);
        MetodoPago metodoPago = resolverMetodoPago(metodoPagoId);
        SubrubroServicioTecnico subrubro = resolverSubrubro(subrubroServicioId);

        if (esNuevo && "cancelada".equalsIgnoreCase(estadoVenta.getNombre())) {
            throw new BusinessException("No se puede crear un servicio con estado cancelada");
        }

        // Regla de negocio: la recomendacion es obligatoria recien al cerrar el servicio.
        if ("cerrada".equalsIgnoreCase(estadoVenta.getNombre())
                && (servicio.getDiagnostico() == null || servicio.getDiagnostico().isBlank())) {
            throw new BusinessException("Debe cargar una recomendacion para cerrar el servicio");
        }

        servicio.setCliente(cliente);
        servicio.setEstadoVenta(estadoVenta);
        servicio.setMetodoPago(metodoPago);
        servicio.setSubrubroServicio(subrubro);

        validarYPrepararDetalles(servicio.getDetallesVenta(), detallesStockAReponer);

        BigDecimal total = calcularTotal(
                servicio.getDetallesVenta(), servicio.getManoObra(), servicio.getDescuentoGlobal()
        );

        servicio.setTotal(total);
    }

    private void validarImagenes(List<String> archivos) throws BusinessException {
        if (archivos == null || archivos.isEmpty()) {
            return;
        }

        if (archivos.size() > MAX_IMAGENES_EVIDENCIA) {
            throw new BusinessException("Se pueden adjuntar hasta " + MAX_IMAGENES_EVIDENCIA + " imagenes de evidencia");
        }

        if (new HashSet<>(archivos).size() != archivos.size()) {
            throw new BusinessException("No se puede adjuntar la misma imagen mas de una vez");
        }
    }

    // recien con el guardado confirmado se borran del disco las imagenes que se quitaron
    private void borrarImagenesQuitadas(List<String> anteriores, List<String> nuevas) {
        if (anteriores == null) {
            return;
        }

        for (String archivo : anteriores) {
            if (nuevas == null || !nuevas.contains(archivo)) {
                AlmacenImagenes.borrar(archivo);
            }
        }
    }

    private Cliente buscarClienteReal(Long clienteId) throws PersistenceException, BusinessException {
        if (clienteId == null || clienteId <= 0) {
            throw new BusinessException("El cliente es requerido");
        }

        ClienteParticular particular = clienteParticularDAO.buscarPorId(clienteId);
        if (particular != null) {
            return particular;
        }

        ClienteEmpresa empresa = clienteEmpresaDAO.buscarPorId(clienteId);
        if (empresa != null) {
            return empresa;
        }

        throw new BusinessException("No existe un cliente con id " + clienteId);
    }

    private EstadoVenta resolverEstadoVenta(Long estadoVentaId) throws PersistenceException, BusinessException {
        if (estadoVentaId == null || estadoVentaId <= 0) {
            throw new BusinessException("El estado de venta es requerido");
        }

        EstadoVenta estadoVenta = estadoVentaDAO.buscarPorId(estadoVentaId);
        if (estadoVenta == null) {
            throw new BusinessException("No existe el estado de venta indicado");
        }

        return estadoVenta;
    }

    private MetodoPago resolverMetodoPago(Long metodoPagoId) throws PersistenceException, BusinessException {
        if (metodoPagoId == null || metodoPagoId <= 0) {
            throw new BusinessException("El metodo de pago es requerido");
        }

        MetodoPago metodoPago = metodoPagoDAO.buscarPorId(metodoPagoId);
        if (metodoPago == null) {
            throw new BusinessException("No existe el metodo de pago indicado");
        }

        return metodoPago;
    }

    private SubrubroServicioTecnico resolverSubrubro(Long subrubroId) throws PersistenceException, BusinessException {
        if (subrubroId == null || subrubroId <= 0) {
            throw new BusinessException("El subrubro del servicio es requerido");
        }

        SubrubroServicioTecnico subrubro = subrubroServicioTecnicoDAO.buscarPorId(subrubroId);
        if (subrubro == null) {
            throw new BusinessException("No existe el subrubro indicado");
        }

        return subrubro;
    }

    // A diferencia de venta de producto, los repuestos son opcionales: un
    // servicio puede consistir solo en mano de obra, sin usar ningun producto.
    private void validarYPrepararDetalles(
            List<DetalleVenta> detalles,
            List<DetalleVenta> detallesStockAReponer
    ) throws PersistenceException, BusinessException {

        if (detalles == null || detalles.isEmpty()) {
            return;
        }

        Map<Long, Integer> cantidadesPorProducto = agruparCantidades(detalles);
        Map<Long, Integer> cantidadesAReponer = agruparCantidades(detallesStockAReponer);
        Map<Long, Producto> productosReales = new HashMap<>();

        // Los repuestos que ya estaban en el servicio conservan el precio al que se cargaron;
        // solo los repuestos nuevos toman el precio actual del producto.
        Map<Long, BigDecimal> preciosOriginales = new HashMap<>();
        if (detallesStockAReponer != null) {
            for (DetalleVenta anterior : detallesStockAReponer) {
                if (anterior.getId() != null) {
                    preciosOriginales.put(anterior.getId(), anterior.getPrecioUnitario());
                }
            }
        }

        for (Map.Entry<Long, Integer> entrada : cantidadesPorProducto.entrySet()) {
            Long productoId = entrada.getKey();
            int cantidadSolicitada = entrada.getValue();

            Producto producto = productoDAO.buscarPorId(productoId);

            if (producto == null) {
                throw new BusinessException("No existe el producto con id " + productoId);
            }

            // Un producto inactivo no se puede agregar ni sumar de nuevo a un servicio,
            // pero si ya estaba, se puede dejar igual o reducir.
            if (!producto.isActivo()
                    && cantidadSolicitada > cantidadesAReponer.getOrDefault(productoId, 0)) {
                throw new BusinessException("El producto " + producto.getNombre() + " se encuentra inactivo");
            }

            int stockDisponible = producto.getStock() + cantidadesAReponer.getOrDefault(productoId, 0);

            if (stockDisponible < cantidadSolicitada) {
                throw new BusinessException(
                        "Stock insuficiente para el producto " + producto.getNombre()
                        + ". Disponible: " + stockDisponible);
            }

            productosReales.put(productoId, producto);
        }

        for (DetalleVenta detalle : detalles) {
            Producto productoReal = productosReales.get(detalle.getProducto().getId());
            detalle.setProducto(productoReal);

            BigDecimal precioOriginal = detalle.getId() != null
                    ? preciosOriginales.get(detalle.getId())
                    : null;

            detalle.setPrecioUnitario(precioOriginal != null ? precioOriginal : productoReal.getPrecioActual());
        }
    }

    private Map<Long, Integer> agruparCantidades(List<DetalleVenta> detalles) throws BusinessException {
        Map<Long, Integer> cantidades = new HashMap<>();

        if (detalles == null) {
            return cantidades;
        }

        for (DetalleVenta detalle : detalles) {
            if (detalle == null || detalle.getProducto() == null || detalle.getProducto().getId() == null) {
                throw new BusinessException("Todos los detalles deben indicar un producto");
            }
            cantidades.merge(detalle.getProducto().getId(), detalle.getCantidad(), Integer::sum);
        }

        return cantidades;
    }

    private BigDecimal calcularTotal(List<DetalleVenta> detalles, BigDecimal manoObra, int descuentoGlobal) {
        BigDecimal subtotal = manoObra != null ? manoObra : BigDecimal.ZERO;

        if (detalles != null) {
            for (DetalleVenta detalle : detalles) {
                subtotal = subtotal.add(
                        detalle.getPrecioUnitario().multiply(BigDecimal.valueOf(detalle.getCantidad()))
                );
            }
        }

        BigDecimal descuento = subtotal.multiply(BigDecimal.valueOf(descuentoGlobal))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        return subtotal.subtract(descuento).setScale(2, RoundingMode.HALF_UP);
    }

    private VentaServTecnico crearEnTransaccion(VentaServTecnico servicio)
            throws PersistenceException, BusinessException, SQLException {

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                VentaServTecnico servicioCreado = ventaServTecnicoDAO.crear(servicio, conn);

                for (DetalleVenta detalle : servicio.getDetallesVenta()) {
                    detalleVentaDAO.crear(detalle, servicioCreado.getId(), conn);
                }

                imagenVentaDAO.sincronizar(
                        servicioCreado.getId(), Collections.emptyList(), servicio.getImagenesEvidencia(), conn
                );

                descontarStockDeDetalles(servicio.getDetallesVenta(), conn);

                servicioCreado.setDetallesVenta(servicio.getDetallesVenta());
                conn.commit();

                return servicioCreado;

            } catch (PersistenceException | BusinessException | SQLException | RuntimeException e) {
                rollbackTransaccion(conn);
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private VentaServTecnico actualizarEnTransaccion(
            VentaServTecnico servicio, VentaServTecnico servicioExistente
    ) throws PersistenceException, BusinessException, SQLException {

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                if (!estaCancelada(servicioExistente)) {
                    reponerStockDeDetalles(servicioExistente.getDetallesVenta(), conn);
                }

                VentaServTecnico servicioActualizado = ventaServTecnicoDAO.actualizar(servicio, conn);

                sincronizarDetalles(
                        servicioExistente.getDetallesVenta(),
                        servicio.getDetallesVenta(),
                        servicio.getId(),
                        conn
                );

                imagenVentaDAO.sincronizar(
                        servicio.getId(),
                        servicioExistente.getImagenesEvidencia(),
                        servicio.getImagenesEvidencia(),
                        conn
                );

                if (!estaCancelada(servicioActualizado)) {
                    descontarStockDeDetalles(servicio.getDetallesVenta(), conn);
                }

                servicioActualizado.setDetallesVenta(servicio.getDetallesVenta());
                conn.commit();

                return servicioActualizado;

            } catch (PersistenceException | BusinessException | SQLException | RuntimeException e) {
                rollbackTransaccion(conn);
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    // Se usa tanto para cancelar como para cerrar; "reponerStock" solo aplica
    // al cancelar (cerrar un servicio no devuelve los repuestos ya usados).
    private VentaServTecnico cambiarEstadoEnTransaccion(
            VentaServTecnico servicio, EstadoVenta nuevoEstado, boolean reponerStock
    ) throws PersistenceException, BusinessException, SQLException {

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                if (reponerStock && !estaCancelada(servicio)) {
                    reponerStockDeDetalles(servicio.getDetallesVenta(), conn);
                }

                servicio.setEstadoVenta(nuevoEstado);
                servicio.setFechaCierre(LocalDate.now());

                VentaServTecnico servicioActualizado = ventaServTecnicoDAO.actualizar(servicio, conn);

                servicioActualizado.setDetallesVenta(servicio.getDetallesVenta());
                conn.commit();

                return servicioActualizado;

            } catch (PersistenceException | BusinessException | SQLException | RuntimeException e) {
                rollbackTransaccion(conn);
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private boolean estaCancelada(VentaServTecnico servicio) {
        return servicio != null
                && servicio.getEstadoVenta() != null
                && "cancelada".equalsIgnoreCase(servicio.getEstadoVenta().getNombre());
    }

    private void descontarStockDeDetalles(List<DetalleVenta> detalles, Connection conn)
            throws PersistenceException, BusinessException {

        for (Map.Entry<Long, Integer> entrada : agruparCantidades(detalles).entrySet()) {
            productoDAO.descontarStock(entrada.getKey(), entrada.getValue(), conn);
        }
    }

    private void reponerStockDeDetalles(List<DetalleVenta> detalles, Connection conn)
            throws PersistenceException, BusinessException {

        for (Map.Entry<Long, Integer> entrada : agruparCantidades(detalles).entrySet()) {
            productoDAO.reponerStock(entrada.getKey(), entrada.getValue(), conn);
        }
    }

    private void rollbackTransaccion(Connection conn) {
        try {
            conn.rollback();
        } catch (SQLException e) {
            logger.error("No se pudo revertir la transaccion del servicio tecnico", e);
        }
    }

    private void sincronizarDetalles(
            List<DetalleVenta> detallesAnteriores,
            List<DetalleVenta> detallesNuevos,
            Long servicioId,
            Connection conn
    ) throws PersistenceException, BusinessException {

        Map<Long, DetalleVenta> anterioresPorId = new HashMap<>();
        for (DetalleVenta detalleAnterior : detallesAnteriores) {
            anterioresPorId.put(detalleAnterior.getId(), detalleAnterior);
        }

        Set<Long> idsRecibidos = new HashSet<>();

        for (DetalleVenta detalleNuevo : detallesNuevos) {
            if (detalleNuevo.getId() == null) {
                detalleVentaDAO.crear(detalleNuevo, servicioId, conn);
                continue;
            }

            if (!anterioresPorId.containsKey(detalleNuevo.getId())) {
                throw new BusinessException("El detalle con id " + detalleNuevo.getId() + " no pertenece a este servicio");
            }

            detalleVentaDAO.actualizar(detalleNuevo, conn);
            idsRecibidos.add(detalleNuevo.getId());
        }

        for (Long idDetalleAnterior : anterioresPorId.keySet()) {
            if (!idsRecibidos.contains(idDetalleAnterior)) {
                detalleVentaDAO.eliminarPorId(idDetalleAnterior, conn);
            }
        }
    }
}