import assert from 'node:assert';
import { caidasPorMomentoDetallado } from '../src/services/analytics/falls.ts';
import { diagnosticoClasificacion } from '../src/services/analytics/desercionBase.ts';

const r = (totalDias, pasa) => ({
  id: Math.random().toString(36).slice(2),
  origenHoja: 'T',
  jurisdiccion: 'LIMA',
  fechaIngreso: '2026-01-15',
  zonaComercial: 'Z1',
  sede: 'S1',
  distrito: 'D1',
  nombreTienda: 'T1',
  supervisor: 'SUP',
  responsableAS: 'RAS',
  dni: '1',
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
  fechasISO: { fechaIngreso: '2026-01-15', inicio: '', fin: '', entrega: '' },
});

let casos = 0;
function check(name, records) {
  const rows = caidasPorMomentoDetallado(records);
  const d = diagnosticoClasificacion(records);

  // Siempre 13 filas: 'Nunca asistió' + Día 1..Día 12
  assert.strictEqual(rows.length, 13, `${name}: se esperaban 13 momentos, hay ${rows.length}`);
  assert.strictEqual(rows[0].name, 'Nunca asistió', `${name}: la primera fila debe ser 'Nunca vendió'`);
  assert.strictEqual(rows[12].name, 'Día 12', `${name}: la última fila debe ser 'Día 12'`);
  rows.forEach((row, i) => assert.ok(row.name, `${name}: momento ${i} sin nombre`));

  const sumDesc = rows.reduce((s, x) => s + x.desercion, 0);
  const sumBajas = rows.reduce((s, x) => s + x.bajas, 0);
  const sumTotal = rows.reduce((s, x) => s + x.total, 0);

  // Coincide con la fuente de verdad de clasificación
  assert.strictEqual(sumDesc, d.desercion, `${name}: deserción ${sumDesc} != ${d.desercion}`);
  assert.strictEqual(sumBajas, d.bajas, `${name}: bajas ${sumBajas} != ${d.bajas}`);
  assert.strictEqual(sumTotal, d.desercion + d.bajas, `${name}: total no cuadra`);

  // Por definición la deserción solo puede caer en 'Nunca asistió'
  const descFuera = rows.slice(1).filter((x) => x.desercion > 0);
  assert.strictEqual(descFuera.length, 0, `${name}: deserción fuera de 'Nunca asistió'`);

  // Las bajas solo pueden caer en días 1..12
  const bajasEnCero = rows[0].bajas;
  assert.strictEqual(bajasEnCero, 0, `${name}: bajas en 'Nunca asistió'`);

  // total = desercion + bajas en cada fila
  for (const row of rows) {
    assert.strictEqual(row.total, row.desercion + row.bajas, `${name}: total != desercion + bajas en ${row.name}`);
  }

  // Los porcentajes suman 100 sobre el total de caídas (0 si no hay caídas)
  const pct = rows.reduce((s, x) => s + x.porcentaje, 0);
  const esperado = sumTotal > 0 ? 100 : 0;
  assert.ok(Math.abs(pct - esperado) < 1e-9, `${name}: los porcentajes suman ${pct}, se esperaba ${esperado}`);

  casos += 1;
  console.log(`OK  ${name.padEnd(46)} desercion=${sumDesc}  bajas=${sumBajas}  total=${sumTotal}`);
}

// Caso 1: sólo deserción
check('solo desercion (3 registros, 0 días)', [r(0, 0), r(0, 0), r(0, 0)], {});

// Caso 2: sólo bajas repartidas
check(
  'solo bajas dias 1,2,3,12',
  [r(1, 0), r(2, 0), r(3, 0), r(12, 0)],
  {},
);

// Caso 3: mezcla realista
check(
  'mezcla: 40 desercion + bajas en dias 1-12',
  [
    ...Array.from({ length: 40 }, () => r(0, 0)),
    ...Array.from({ length: 3 }, () => r(1, 0)),
    ...Array.from({ length: 2 }, () => r(2, 0)),
    r(5, 0),
    r(12, 0),
  ],
  {},
);

// Caso 4:Nulls de días NO cuentan como caída
check('null dias + pasa null (sin clasificar)', [r(null, null), r(null, 0)], {});

// Caso 5: aprobado no es caída
check('aprobados y en capacitacion no son caidas', [r(3, 1), r(4, null), r(0, 0)], {});

// Caso 6: sin caídas
check('sin caidas', [r(3, 1), r(4, null)], {});

// Verificación puntual de días exactos
const rows = caidasPorMomentoDetallado([r(0, 0), r(1, 0), r(1, 0), r(7, 0)]);
assert.strictEqual(rows[0].desercion, 1, 'Día 0: 1 deserción');
assert.strictEqual(rows[1].bajas, 2, 'Día 1: 2 bajas');
assert.strictEqual(rows[7].bajas, 1, 'Día 7: 1 baja');
assert.strictEqual(rows[0].total, 1, 'Día 0: total 1');
assert.strictEqual(rows[1].porcentaje.toFixed(1), '50.0', 'Día 1: 50% de las caídas');
console.log('OK  distribucion exacta por dia');

// Días fuera de rango se recortan al máximo
const fuera = caidasPorMomentoDetallado([r(0, 0), r(30, 0)]);
assert.strictEqual(fuera[12].bajas, 1, 'un totalDias=30 debe caer en Día 12');
console.log('OK  dias fuera de rango se recortan a Dia 12');

console.log(`\n${casos} escenarios + 2 verificaciones puntuales: todo correcto.`);
