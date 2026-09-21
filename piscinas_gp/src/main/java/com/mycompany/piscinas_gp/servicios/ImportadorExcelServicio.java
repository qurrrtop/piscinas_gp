package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.dtos.EstadoImportacion;
import com.mycompany.piscinas_gp.dtos.ProductoImportDTO;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

/**
 * Lee cualquier lista de precios en el formato que el cliente ya usa para
 * pasar en limpio los catalogos de sus proveedores: secciones de categoria
 * intercaladas entre filas de producto, con columnas que pueden variar
 * segun el archivo (algunos traen codigo, otros no; el nombre de la
 * columna de unidad cambia). Detecta el rol de cada columna leyendo el
 * texto de su encabezado, en vez de asumir una posicion fija.
 */
public class ImportadorExcelServicio {

    private static final int MAX_COLUMNAS = 12;

    private enum RolColumna {
        CODIGO, DESCRIPCION, UNIDAD, PRECIO, PACK
    }

    public List<ProductoImportDTO> parsear(InputStream excelInputStream, Long marcaId) throws IOException {

        if (marcaId == null) {
            throw new IllegalArgumentException("Debe seleccionarse una marca especifica para importar");
        }

        List<ProductoImportDTO> resultado = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();

        try (Workbook workbook = new XSSFWorkbook(excelInputStream)) {
            Sheet sheet = workbook.getSheetAt(0);

            Map<Integer, RolColumna> mapeoColumnas = null;
            String seccionActual = null;

            for (Row row : sheet) {
                List<String> celdas = leerCeldasComoTexto(row, formatter);

                if (todasVacias(celdas)) {
                    continue;
                }

                Map<Integer, RolColumna> encabezadoDetectado = detectarEncabezado(celdas);
                if (encabezadoDetectado != null) {
                    mapeoColumnas = encabezadoDetectado;
                    continue;
                }

                if (mapeoColumnas == null) {
                    continue; // todavia no encontramos el primer encabezado (titulo/vigencia del archivo)
                }

                if (esFilaSeccion(celdas)) {
                    seccionActual = primerTextoNoVacio(celdas);
                    continue;
                }

                String descripcionCruda = obtenerValorPorRol(celdas, mapeoColumnas, RolColumna.DESCRIPCION);
                if (descripcionCruda == null) {
                    continue; // fila sin descripcion, no es un producto
                }

                resultado.add(mapearFila(
                        row.getRowNum() + 1, celdas, mapeoColumnas, seccionActual, marcaId, descripcionCruda));
            }
        }

        return resultado;
    }

    private List<String> leerCeldasComoTexto(Row row, DataFormatter formatter) {
        List<String> celdas = new ArrayList<>();
        for (int i = 0; i < MAX_COLUMNAS; i++) {
            var cell = row.getCell(i);
            String valor = cell == null ? null : formatter.formatCellValue(cell).trim();
            celdas.add((valor == null || valor.isEmpty()) ? null : valor);
        }
        return celdas;
    }

    private boolean todasVacias(List<String> celdas) {
        return celdas.stream().allMatch(c -> c == null);
    }

    private String primerTextoNoVacio(List<String> celdas) {
        return celdas.stream().filter(c -> c != null).findFirst().orElse(null);
    }

    /** Una fila de seccion tiene un solo texto en toda la fila (el resto vacio). */
    private boolean esFilaSeccion(List<String> celdas) {
        return celdas.stream().filter(c -> c != null).count() == 1;
    }

    /**
     * Intenta interpretar la fila como encabezado de columnas, resolviendo
     * el rol de cada celda por su texto. Requiere encontrar DESCRIPCION y
     * al menos otro rol para considerarla un encabezado valido.
     */
    private Map<Integer, RolColumna> detectarEncabezado(List<String> celdas) {
        Map<Integer, RolColumna> mapeo = new HashMap<>();

        for (int i = 0; i < celdas.size(); i++) {
            String texto = celdas.get(i);
            if (texto == null) {
                continue;
            }
            RolColumna rol = resolverRolColumna(texto);
            if (rol != null) {
                mapeo.put(i, rol);
            }
        }

        boolean tieneDescripcion = mapeo.containsValue(RolColumna.DESCRIPCION);
        if (tieneDescripcion && mapeo.size() >= 2) {
            return mapeo;
        }
        return null;
    }

    private RolColumna resolverRolColumna(String textoEncabezado) {
        String texto = ImportadorTextoUtil.normalizar(textoEncabezado);

        if (texto.contains("codigo") || texto.contains("cod.")) {
            return RolColumna.CODIGO;
        }
        if (texto.contains("descripcion")) {
            return RolColumna.DESCRIPCION;
        }
        if (texto.contains("pack")) {
            return RolColumna.PACK;
        }
        if (texto.contains("precio") || texto.contains("prec.")) {
            return RolColumna.PRECIO;
        }
        if (texto.contains("unid") || texto.contains("kg/lts") || texto.contains("kg / lts")
                || texto.contains("presentacion")) {
            return RolColumna.UNIDAD;
        }
        return null;
    }

    private String obtenerValorPorRol(List<String> celdas, Map<Integer, RolColumna> mapeo, RolColumna rol) {
        for (Map.Entry<Integer, RolColumna> entry : mapeo.entrySet()) {
            if (entry.getValue() == rol && entry.getKey() < celdas.size()) {
                return celdas.get(entry.getKey());
            }
        }
        return null;
    }

    private ProductoImportDTO mapearFila(int numeroFila, List<String> celdas, Map<Integer, RolColumna> mapeoColumnas,
                                          String seccionActual, Long marcaId, String descripcionCruda) {

        ProductoImportDTO dto = new ProductoImportDTO();
        dto.setFila(numeroFila);
        dto.setCodigoProveedor(obtenerValorPorRol(celdas, mapeoColumnas, RolColumna.CODIGO));
        dto.setDescripcionOriginal(descripcionCruda);
        dto.setSeccionOriginal(seccionActual);
        dto.setMarcaId(marcaId);

        ImportadorTextoUtil.ResultadoParseo parseo = ImportadorTextoUtil.parsearDescripcion(descripcionCruda);
        dto.setNombre(parseo.nombre());
        dto.setDescripcion(parseo.descripcionRestante());
        dto.setContenido(parseo.contenido());
        dto.setUniMedidaId(parseo.uniMedidaId());

        Long categoriaId = ImportadorTextoUtil.resolverCategoria(seccionActual);
        dto.setCategoriaId(categoriaId);

        String precioTexto = obtenerValorPorRol(celdas, mapeoColumnas, RolColumna.PRECIO);
        BigDecimal precio = parsearPrecio(precioTexto);
        dto.setPrecio(precio != null ? precio : BigDecimal.ZERO);

        dto.setStock(0);
        dto.setStockMin(0);

        if (dto.getNombre() == null || dto.getNombre().isBlank() || dto.getNombre().length() < 3) {
            dto.setEstado(EstadoImportacion.ERROR);
            dto.setMotivo("No se pudo determinar un nombre de producto valido");
        } else if (categoriaId == null) {
            dto.setEstado(EstadoImportacion.ADVERTENCIA);
            dto.setMotivo("No se pudo determinar la categoria automaticamente; seleccionarla manualmente");
        } else {
            dto.setEstado(EstadoImportacion.VALIDO);
        }

        return dto;
    }

    /** Interpreta precios en formato argentino ("$ 74.000,00") o formatos simples ("74000", "74000.5"). */
    private BigDecimal parsearPrecio(String texto) {
        if (texto == null) {
            return null;
        }

        String limpio = texto.replaceAll("[^0-9.,\\-]", "");
        if (limpio.isBlank() || limpio.equals("-")) {
            return null;
        }

        boolean tienePunto = limpio.contains(".");
        boolean tieneComa = limpio.contains(",");

        try {
            if (tienePunto && tieneComa) {
                // el separador decimal es el que aparece mas a la derecha
                if (limpio.lastIndexOf(',') > limpio.lastIndexOf('.')) {
                    limpio = limpio.replace(".", "").replace(",", ".");
                } else {
                    limpio = limpio.replace(",", "");
                }
            } else if (tieneComa) {
                limpio = limpio.replace(",", ".");
            } else if (tienePunto) {
                int posicion = limpio.lastIndexOf('.');
                boolean pareceMiles = limpio.length() - posicion - 1 == 3 && limpio.indexOf('.') != posicion;
                if (pareceMiles) {
                    limpio = limpio.replace(".", "");
                }
            }
            return new BigDecimal(limpio);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}