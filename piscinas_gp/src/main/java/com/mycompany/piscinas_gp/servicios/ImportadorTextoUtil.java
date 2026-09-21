package com.mycompany.piscinas_gp.servicios;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ImportadorTextoUtil {

    public static final long CATEGORIA_QUIMICO = 1L;
    public static final long CATEGORIA_ACCESORIOS = 2L;
    public static final long CATEGORIA_REPUESTO = 3L;

    public static final long UNIDAD_UNIDAD = 1L;
    public static final long UNIDAD_KG = 2L;
    public static final long UNIDAD_G = 3L;
    public static final long UNIDAD_LT = 4L;
    public static final long UNIDAD_PPM = 5L;
    public static final long UNIDAD_M3H = 6L;
    public static final long UNIDAD_PULGADA = 7L;

    // mapeo exacto seccion (normalizada) -> categoria, basado en las secciones reales del archivo Vulcano
    private static final Map<String, Long> SECCION_A_CATEGORIA = new HashMap<>();
    static {
        String[] quimico = {
            "Dosificadores de Cloro", "Cloro Disolucion INSTANTANEA Granulado",
            "Cloro Disolucion RAPIDA Granulado", "Cloro Disolucion LENTA Granulado",
            "Triple Accion Disolucion RAPIDA Granulado", "Pastillas de Cloro 200gr",
            "Pastillas de Cloro 50gr", "Triple Accion Pastillas 200gr",
            "Triple Accion Pastillas 50gr", "Clarificador", "Alguicida",
            "Bactericida | Funguicida", "Test Kit"
        };
        String[] repuesto = {
            "Manometro", "Cargas Filtrantes", "Material Filtrante",
            "Fuentes de Alimentacion", "Fuentes de Alimentacion Selladas"
        };
        String[] accesorios = {
            "Bombas Piscinas BAS", "Bombas Piscinas BAE", "Bombas Piscinas BAP",
            "Bombas Piscinas BAC", "Bombas Piscinas BAT", "Filtros Residenciales Soplados",
            "Filtros Comerciales Soplados", "Filtros Comerciales Rotomoldeados",
            "Filtros Piscinas Olimpicas - SERIE VB", "Bombas Piscinas BAF con cartucho filtrante",
            "Skimmer con Filtro", "Equipos Portatiles de Filtracion", "Carros", "Skimmers",
            "Tomas de Fondo", "Retornos Orientables - Piscinas de Hormigon",
            "Retornos Orientables - Piscinas de Fibra de Vidrio", "Retornos Orientables - Especiales",
            "Virolas - Piscinas de Hormigon", "Virolas - Piscinas de Fibra de Vidrio",
            "Rebosaderos", "Hidromasajeadores", "OPCIONAL > ARO DESMONTABLE CROMADO",
            "Accesorios de Instalacion Linea AISI 316", "Multivalvulas de 2 y 3 Vias",
            "Uniones Doble", "Pre-Filtros | Trampa de Pelos", "Rejillas para Vereda Perimetral",
            "Casillas", "Escaleras Modelo CONFORT", "Barandas", "Pasamanos",
            "Ducha de Acero Inoxidable", "Duchas Solares", "Accesorios para Nado", "Trampolines",
            "Cascadas ABS - Conexion \u00d8 50", "Cascadas ABS - Conexion RH 1 1/2\"",
            "Cascadas AISI Tubulares", "Cascadas AISI", "Revestimiento Ceramico",
            "Revestimiento Venecitas", "Guardas Venecitas", "Luminarias SUPERLED",
            "Luminarias LUMIPOOOL", "Luminarias POWERLED 6W", "Luminarias POWERLED 9W",
            "Luminarias POWERLED 18W", "Luminarias LED", "Luminarias SPOT LED",
            "Luminarias HALOGENAS", "Controladores y Expansores", "Accesorios de Conexion",
            "Automatizacion", "Robots Limpiadores de Piscinas", "Limpiafondos",
            "Limpiafondos para Piletas de Lona", "Cepillos", "Sacahojas", "Mangos Fijos",
            "Mangos Telescopicos", "Mangueras", "Mangueras Fraccionadas",
            "Uniones y Terminales para Mangueras", "Mangueras Planas PVC", "Acoples Rapidos",
            "Boyas Dosificadoras", "Equipos de Desinfeccion",
            "Calefaccion | Bombas de Calor POOL-INVERTER ECO",
            "Calefaccion | Bombas de Calor POOL-INVERTER PLUS",
            "Calefaccion | Bombas de Calor POOL-INVERTER PRO",
            "Calefaccion | Deshumidificadores", "Calefaccion | Colectores Solares",
            "Calefaccion | Termometros", "Calefaccion | Cubiertas para piscinas",
            "Kit de Carriles Adicionales para Cubiertas"
        };
        // agregar a los arrays de SECCION_A_CATEGORIA (dentro del static block), sumando estas líneas nuevas:
        String[] quimicoNuevo = {
            "Cloro Instantaneo", "Cloro granulado", "Pastillas Triple accion",
            "Alguicidas", "Clarificador"
        };
        String[] accesoriosNuevo = {
            "Luces para psicinas", "Controladores"
        };
        for (String s : quimicoNuevo) SECCION_A_CATEGORIA.put(normalizar(s), CATEGORIA_QUIMICO);
        for (String s : accesoriosNuevo) SECCION_A_CATEGORIA.put(normalizar(s), CATEGORIA_ACCESORIOS);

        for (String s : quimico) SECCION_A_CATEGORIA.put(normalizar(s), CATEGORIA_QUIMICO);
        for (String s : repuesto) SECCION_A_CATEGORIA.put(normalizar(s), CATEGORIA_REPUESTO);
        for (String s : accesorios) SECCION_A_CATEGORIA.put(normalizar(s), CATEGORIA_ACCESORIOS);
    }

    private static final Pattern CARACTERES_INVALIDOS_NOMBRE = Pattern.compile("[^a-zA-ZÀ-ÿ0-9\\s:º°'.-]");
    private static final Pattern CARACTERES_INVALIDOS_DESCRIPCION = Pattern.compile("[^a-zA-ZÀ-ÿ0-9\\s:º°',.()-]");

    private static String sanear(String texto, Pattern caracteresInvalidos) {
        if (texto == null) {
            return "";
        }
        return caracteresInvalidos.matcher(texto)
                .replaceAll(" ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static final List<PatronUnidad> PATRONES_CONTENIDO = List.of(
        new PatronUnidad(Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*KG", Pattern.CASE_INSENSITIVE), UNIDAD_KG),
        new PatronUnidad(Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*GR?\\b", Pattern.CASE_INSENSITIVE), UNIDAD_G),
        new PatronUnidad(Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(?:LT|L)\\b", Pattern.CASE_INSENSITIVE), UNIDAD_LT),
        new PatronUnidad(Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*PPM", Pattern.CASE_INSENSITIVE), UNIDAD_PPM),
        new PatronUnidad(Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*M3?/H", Pattern.CASE_INSENSITIVE), UNIDAD_M3H),
        new PatronUnidad(Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(?:\"|PULG(?:ADA)?S?)", Pattern.CASE_INSENSITIVE), UNIDAD_PULGADA)
    );

    private ImportadorTextoUtil() {
    }

    /** Resuelve la categoria: primero exacto contra la lista real de secciones, null si no matchea nada. */
    public static Long resolverCategoria(String nombreSeccion) {
        if (nombreSeccion == null) {
            return null;
        }
        return SECCION_A_CATEGORIA.get(normalizar(nombreSeccion));
    }

    public record ResultadoParseo(String nombre, String descripcionRestante,
                                   BigDecimal contenido, Long uniMedidaId) {
    }

    public static ResultadoParseo parsearDescripcion(String descripcionCruda) {
        String texto = descripcionCruda == null ? "" : descripcionCruda.trim();

        for (PatronUnidad patron : PATRONES_CONTENIDO) {
            Matcher m = patron.pattern().matcher(texto);
            if (m.find()) {
                BigDecimal contenido = new BigDecimal(m.group(1).replace(",", "."))
                        .setScale(2, RoundingMode.HALF_UP);

                String nombre = limpiarNombre(texto.substring(0, m.start()));
                String restante = limpiarSeparadores(texto.substring(m.end()));

                if (nombre.isEmpty()) {
                    nombre = texto;
                }

                nombre = sanear(nombre, CARACTERES_INVALIDOS_NOMBRE);
                restante = sanear(restante, CARACTERES_INVALIDOS_DESCRIPCION);

                return new ResultadoParseo(nombre, restante, contenido, patron.unidadId());
            }
        }

        String nombreSaneado = sanear(texto, CARACTERES_INVALIDOS_NOMBRE);
        return new ResultadoParseo(nombreSaneado, "", BigDecimal.ONE, UNIDAD_UNIDAD);
    }

    private static String limpiarNombre(String texto) {
        return texto.replaceAll("[\\s\\-–—(,]+$", "")
                    .replaceAll("(?i)\\s*x\\s*$", "")
                    .trim();
    }

    private static String limpiarSeparadores(String texto) {
        return texto.replaceAll("^[\\s\\-–—()xX.,:]+", "")
                    .replaceAll("[\\s\\-–—()]+$", "")
                    .trim();
    }

    // en ImportadorTextoUtil, cambiar de private a public:
    public static String normalizar(String texto) {
        String sinAcentos = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinAcentos.toLowerCase();
    }

    private record PatronUnidad(Pattern pattern, Long unidadId) {
    }
}