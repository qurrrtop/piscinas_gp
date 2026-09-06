package com.mycompany.piscinas_gp;



import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.ClienteEmpresaDAO;
import com.mycompany.piscinas_gp.daos.ClienteParticularDAO;
import com.mycompany.piscinas_gp.daos.DetalleVentaDAO;
import com.mycompany.piscinas_gp.daos.EstadoVentaDAO;
import com.mycompany.piscinas_gp.daos.MetodoPagoDAO;
import com.mycompany.piscinas_gp.daos.ProductoDAO;
import com.mycompany.piscinas_gp.daos.VentaProductoDAO;
import com.mycompany.piscinas_gp.modelos.VentaProducto;
import com.mycompany.piscinas_gp.servicios.VentaProductoServicio;
import java.util.List;

public class PruebaVentaProductoServicio {

    private static final String OBSERVACION_PRUEBA =
            "PRUEBA_AUTOMATICA_VENTAS";

    public static void main(String[] args) {
        try {
            VentaProductoServicio servicio = crearServicio();

            List<VentaProducto> ventas = servicio.listarVentas();

            System.out.println("Ventas encontradas: " + ventas.size());

            for (VentaProducto venta : ventas) {
                System.out.println(
                        "Venta #" + venta.getId()
                        + " - Total: $" + venta.getTotal()
                        + " - Estado: "
                        + venta.getEstadoVenta().getNombre()
                );
            }

            VentaProducto ventaPrueba = ventas.stream()
                    .filter(venta -> OBSERVACION_PRUEBA.equals(
                    venta.getObservacion()))
                    .findFirst()
                    .orElse(null);

            if (ventaPrueba != null) {
                VentaProducto venta =
                        servicio.buscarVentaPorId(ventaPrueba.getId());

                System.out.println("\nDetalle de venta #" + venta.getId());
                System.out.println("Cliente: " + venta.getCliente().getId());
                System.out.println("Productos: "
                        + venta.getDetallesVenta().size());

                venta.getDetallesVenta().forEach(detalle ->
                        System.out.println(
                                "- " + detalle.getProducto().getNombre()
                                + " | Cantidad: " + detalle.getCantidad()
                                + " | Precio unitario: $"
                                + detalle.getPrecioUnitario()
                        )
                );
            } else {
                System.out.println("No se encontró la venta de prueba."
                        + " Ejecutá datos_prueba_ventas.sql.");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static VentaProductoServicio crearServicio() {
        DbConnection db = DbConnection.getInstance();

        return new VentaProductoServicio(
                new VentaProductoDAO(db),
                new DetalleVentaDAO(db),
                new ProductoDAO(db),
                new ClienteParticularDAO(db),
                new ClienteEmpresaDAO(db),
                new EstadoVentaDAO(db),
                new MetodoPagoDAO(db)
        );
    }
}
