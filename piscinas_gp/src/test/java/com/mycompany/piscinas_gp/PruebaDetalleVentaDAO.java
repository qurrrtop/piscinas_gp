package com.mycompany.piscinas_gp;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.DetalleVentaDAO;
import com.mycompany.piscinas_gp.daos.VentaProductoDAO;
import com.mycompany.piscinas_gp.modelos.DetalleVenta;
import com.mycompany.piscinas_gp.modelos.VentaProducto;
import java.util.List;

/**
 * Prueba de solo lectura para comprobar que DetalleVentaDAO trae los
 * productos asociados a una venta existente.
 */
public class PruebaDetalleVentaDAO {

    private static final String OBSERVACION_PRUEBA =
            "PRUEBA_AUTOMATICA_VENTAS";

    public static void main(String[] args) {
        try {
            DbConnection db = DbConnection.getInstance();

            VentaProductoDAO ventaProductoDAO = new VentaProductoDAO(db);
            DetalleVentaDAO detalleVentaDAO =
                    new DetalleVentaDAO(db);

            VentaProducto ventaPrueba = ventaProductoDAO.buscarTodos()
                    .stream()
                    .filter(venta -> OBSERVACION_PRUEBA.equals(
                    venta.getObservacion()))
                    .findFirst()
                    .orElse(null);

            if (ventaPrueba == null) {
                System.out.println("No se encontró la venta de prueba."
                        + " Ejecutá datos_prueba_ventas.sql.");
                return;
            }

            List<DetalleVenta> detalles =
                    detalleVentaDAO.buscarPorVentaId(ventaPrueba.getId());

            System.out.println("Detalles encontrados: " + detalles.size());

            for (DetalleVenta detalle : detalles) {
                System.out.println(
                        "Detalle #" + detalle.getId()
                        + " | " + detalle.getProducto().getNombre()
                        + " | Cantidad: " + detalle.getCantidad()
                        + " | Precio unitario: $"
                        + detalle.getPrecioUnitario()
                );
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
