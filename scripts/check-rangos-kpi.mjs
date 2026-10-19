import assert from 'node:assert';
import {
  INDICADORES_KPI,
  SEMAFORO_STYLES,
  evaluarNivelKpi,
  analizarReclutadores,
  rangoNivel,
  tooltipKpi,
} from '../src/services/analytics/reclutadores.ts';
import { analizarZonas, ZONA_SEMAFORO_RANGOS } from '../src/services/analytics/zonas.ts';

// ══════════════════════════════════════════════════════════════════
//  1) VALORES LÍMITE POR INDICADOR (rangos propios, sin compartir)
// ══════════════════════════════════════════════════════════════════
const nivel = (id, tasa) => evaluarNivelKpi(id, tasa);

// TASA DE DESERCIÓN: ≤5 / >5-10 / >10-15 / >15
assert.strictEqual(nivel('desercion', 0), 'excelente', 'desercion 0%');
assert.strictEqual(nivel('desercion', 5), 'excelente', 'desercion 5% (límite superior inclusivo)');
assert.strictEqual(nivel('desercion', 5.01), 'aceptable', 'desercion 5.01%');
assert.strictEqual(nivel('desercion', 10), 'aceptable', 'desercion 10%');
assert.strictEqual(nivel('desercion', 10.01), 'riesgo', 'desercion 10.01%');
assert.strictEqual(nivel('desercion', 15), 'riesgo', 'desercion 15%');
assert.strictEqual(nivel('desercion', 15.01), 'critico', 'desercion 15.01%');
assert.strictEqual(nivel('desercion', 100), 'critico', 'desercion 100%');

// TASA DE BAJA EN CAPACITACIÓN: ≤8 / >8-12 / >12-18 / >18 (rangos PROPIOS)
assert.strictEqual(nivel('baja', 0), 'excelente', 'baja 0%');
assert.strictEqual(nivel('baja', 8), 'excelente', 'baja 8% (límite superior inclusivo)');
assert.strictEqual(nivel('baja', 8.01), 'aceptable', 'baja 8.01%');
assert.strictEqual(nivel('baja', 12), 'aceptable', 'baja 12%');
assert.strictEqual(nivel('baja', 12.01), 'riesgo', 'baja 12.01%');
assert.strictEqual(nivel('baja', 18), 'riesgo', 'baja 18%');
assert.strictEqual(nivel('baja', 18.01), 'critico', 'baja 18.01%');
assert.strictEqual(nivel('baja', 100), 'critico', 'baja 100%');

// CONVERSIÓN A OPERACIONES (escala invertida): ≥88 / ≥83<88 / ≥78<83 / <78
assert.strictEqual(nivel('conversion', 100), 'excelente', 'conversion 100%');
assert.strictEqual(nivel('conversion', 88), 'excelente', 'conversion 88% (límite inclusivo)');
assert.strictEqual(nivel('conversion', 87.99), 'aceptable', 'conversion 87.99%');
assert.strictEqual(nivel('conversion', 83), 'aceptable', 'conversion 83%');
assert.strictEqual(nivel('conversion', 82.99), 'riesgo', 'conversion 82.99%');
assert.strictEqual(nivel('conversion', 78), 'riesgo', 'conversion 78%');
assert.strictEqual(nivel('conversion', 77.99), 'critico', 'conversion 77.99%');
assert.strictEqual(nivel('conversion', 0), 'critico', 'conversion 0%');

// PERMANENCIA (escala invertida): ≥95 / ≥90<95 / ≥85<90 / <85
assert.strictEqual(nivel('permanencia', 100), 'excelente', 'permanencia 100%');
assert.strictEqual(nivel('permanencia', 95), 'excelente', 'permanencia 95% (límite inclusivo)');
assert.strictEqual(nivel('permanencia', 94.99), 'aceptable', 'permanencia 94.99%');
assert.strictEqual(nivel('permanencia', 90), 'aceptable', 'permanencia 90%');
assert.strictEqual(nivel('permanencia', 89.99), 'riesgo', 'permanencia 89.99%');
assert.strictEqual(nivel('permanencia', 85), 'riesgo', 'permanencia 85%');
assert.strictEqual(nivel('permanencia', 84.99), 'critico', 'permanencia 84.99%');
assert.strictEqual(nivel('permanencia', 0), 'critico', 'permanencia 0%');

// ══════════════════════════════════════════════════════════════════
//  2) NO EXISTEN RANGOS COMPARTIDOS ENTRE INDICADORES
// ══════════════════════════════════════════════════════════════════
assert.notStrictEqual(nivel('baja', 16), nivel('desercion', 16), 'baja 16% (riesgo, ≤18) ≠ desercion 16% (crítico, >15): umbrales propios');
assert.notStrictEqual(nivel('baja', 16), nivel('conversion', 16), 'baja 16% ≠ conversion 16%');
assert.strictEqual(INDICADORES_KPI.desercion.niveles[1].max, 10, 'desercion aceptable cierra en 10');
assert.strictEqual(INDICADORES_KPI.baja.niveles[1].max, 12, 'baja aceptable cierra en 12');
assert.strictEqual(INDICADORES_KPI.conversion.direccion, 'desc', 'conversion es escala invertida');
assert.strictEqual(INDICADORES_KPI.permanencia.direccion, 'desc', 'permanencia es escala invertida');

// ══════════════════════════════════════════════════════════════════
//  3) FÓRMULAS NO ALTERADAS (cierre de partición + tasas a mano)
// ══════════════════════════════════════════════════════════════════
const r = (totalDias, pasa) => ({
  id: Math.random().toString(36).slice(2),
  origenHoja: 'T',
  jurisdiccion: 'LIMA',
  fechaIngreso: '2026-04-15',
  zonaComercial: 'Z1',
  sede: 'S1',
  distrito: 'D1',
  nombreTienda: 'T1',
  supervisor: 'SUP',
  responsableAS: 'RAS 1',
  dni: String(Math.random()).slice(2, 12),
  apellidosNombres: 'X Y',
  modalidad: 'M',
  capacitador: 'C',
  inicioCapacitacion: '',
  finCapacitacion: '',
  entregaOperaciones: '',
  asistencia: [],
  diasAsistidos: 0,
  diasFaltantes: 0,
  totalDias,
  pasaAOperaciones: pasa,
  motivoCaida: '',
  subMotivoCaida: '',
  resultado: 'PENDIENTE',
  estado: 'EN_CAPACITACION',
  fechasISO: { fechaIngreso: '2026-04-15', inicio: '', fin: '', entrega: '' },
});

// Mezcla: 2 deserciones, 1 baja, 2 aprobados, 2 en capacitación → 7 ingresos
const records = [r(0, 0), r(0, null), r(3, 0), r(4, 1), r(5, 1), r(6, null), r(7, null)];
const a = analizarReclutadores(records);
const rp = a.productividad[0];

assert.strictEqual(a.totalIngresos, 7, 'total ingresos');
assert.strictEqual(
  a.totalIngresos,
  a.totalDeserciones + a.totalCaidasCapacitacion + a.totalAprobados + a.totalEnCapacitacion,
  'partición cierra: INGRESOS = DESERCIÓN + BAJAS + APROBADOS + EN CAPACITACIÓN',
);
assert.strictEqual(a.totalDeserciones, 2, 'deserciones (TOTAL DE DÍAS = 0)');
assert.strictEqual(a.totalCaidasCapacitacion, 1, 'bajas (días >= 1 y PASA = 0)');
assert.strictEqual(a.totalAprobados, 2, 'aprobados (días >= 1 y PASA = 1)');
assert.strictEqual(a.totalEnCapacitacion, 2, 'en capacitación (días >= 1 y PASA vacío)');

// Tasas exactas: fórmulas intactas
assert.ok(Math.abs(rp.tasaDesercion - (2 / 7) * 100) < 1e-9, 'tasa deserción = deserciones/ingresos*100');
assert.ok(Math.abs(rp.tasaBaja - (1 / 7) * 100) < 1e-9, 'tasa baja = bajas/ingresos*100');
assert.ok(Math.abs(rp.tasaConversion - (2 / 7) * 100) < 1e-9, 'tasa conversion = aprobados/ingresos*100');
assert.ok(Math.abs(rp.tasaPermanencia - (4 / 7) * 100) < 1e-9, 'permanencia = (aprobados+encap)/ingresos*100');

// Niveles precalculados coherentes con evaluarNivelKpi
assert.strictEqual(rp.nivel, evaluarNivelKpi('desercion', rp.tasaDesercion), 'nivel deserción coherente');
assert.strictEqual(rp.nivelBaja, evaluarNivelKpi('baja', rp.tasaBaja), 'nivel baja coherente');
assert.strictEqual(rp.nivelConversion, evaluarNivelKpi('conversion', rp.tasaConversion), 'nivel conversion coherente');
assert.strictEqual(rp.nivelPermanencia, evaluarNivelKpi('permanencia', rp.tasaPermanencia), 'nivel permanencia coherente');

// ══════════════════════════════════════════════════════════════════
//  4) ETIQUETAS DEL SISTEMA
// ══════════════════════════════════════════════════════════════════
assert.strictEqual(SEMAFORO_STYLES.aceptable.label, 'Aceptable', "etiqueta 'Aceptable' (reemplaza a 'Bueno')");
assert.strictEqual(Object.keys(SEMAFORO_STYLES).length, 4, 'exactamente 4 niveles');
assert.deepStrictEqual(Object.keys(SEMAFORO_STYLES), ['excelente', 'aceptable', 'riesgo', 'critico'], 'orden de niveles');

// ══════════════════════════════════════════════════════════════════
//  5) TOOLTIPS DE PILLS (etiqueta · rango del indicador)
// ══════════════════════════════════════════════════════════════════
assert.strictEqual(tooltipKpi('desercion', 'critico'), 'Crítico · > 15%', 'tooltip deserción crítico');
assert.strictEqual(tooltipKpi('baja', 'riesgo'), 'Riesgo · > 12% – 18%', 'tooltip baja riesgo (rango propio)');
assert.strictEqual(tooltipKpi('conversion', 'aceptable'), 'Aceptable · 83% – 88%', 'tooltip conversion aceptable');
assert.strictEqual(tooltipKpi('permanencia', 'excelente'), 'Excelente · ≥ 95%', 'tooltip permanencia excelente');
assert.strictEqual(rangoNivel('conversion', 'aceptable'), '83% – 88%', 'rangoNivel conversion aceptable');
assert.strictEqual(rangoNivel('baja', 'excelente'), '≤ 8%', 'rangoNivel baja excelente');

// ══════════════════════════════════════════════════════════════════
//  6) ZONAS ALINEADAS A INDICADORES_KPI.desercion (misma clasificación)
// ══════════════════════════════════════════════════════════════════
// Leyenda derivada de la config central (rangos 5/10/15, sin umbrales locales 3/6/9)
assert.strictEqual(ZONA_SEMAFORO_RANGOS.length, 4, 'leyenda zonas: 4 niveles');
assert.deepStrictEqual(
  ZONA_SEMAFORO_RANGOS.map((z) => z.rango),
  INDICADORES_KPI.desercion.niveles.map((z) => z.rango),
  'leyenda zonas deriva sus rangos de INDICADORES_KPI.desercion',
);
// Tasa 7%: con umbrales antiguos 3/6/9 era 'riesgo'; alineado a 5/10/15 es 'aceptable'
// (regla desercionBase: TOTAL DE DÍAS = 0 Y PASA A OPERACIONES = 0 numérico)
const zonasRecords = [
  ...Array.from({ length: 7 }, () => r(0, 0)),
  ...Array.from({ length: 93 }, () => r(4, null)),
];
const za = analizarZonas(zonasRecords);
const z1 = za.porTasa[0];
assert.strictEqual(za.totalZonas, 1, 'zonas: 1 zona');
assert.ok(Math.abs(z1.tasaDesercion - 7) < 1e-9, 'zonas: tasa 7%');
assert.strictEqual(z1.nivel, 'aceptable', "zonas 7% → 'aceptable' (rangos compartidos 5/10/15)");
assert.strictEqual(z1.nivel, evaluarNivelKpi('desercion', 7), 'zonas usa la misma lógica que Reclutadores');

console.log('OK check-rangos-kpi: valores límite, rangos por indicador, fórmulas intactas, etiquetas, tooltips y zonas alineadas.');
