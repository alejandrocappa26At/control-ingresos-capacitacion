import assert from 'node:assert';
import { analizarCapacitadores } from '../src/services/analytics/charts.ts';
import { computeKpis } from '../src/services/analytics/kpis.ts';

const r = (totalDias, pasa, extra = {}) => ({
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
  ...extra,
});

function check(name, records, expect = {}) {
  const { capacitadores, diferenciaTotal, desbalances, registrosExcluidos } = analizarCapacitadores(records);

  assert.strictEqual(diferenciaTotal, 0, `${name}: la partición no cierra (diferencia ${diferenciaTotal})`);
  assert.deepStrictEqual(desbalances, [], `${name}: capacitadores desbalanceados: ${JSON.stringify(desbalances)}`);

  const totals = capacitadores.reduce(
    (a, c) => ({
      asignados: a.asignados + c.asignados,
      inician: a.inician + c.inicianCapacitacion,
      aprobados: a.aprobados + c.aprobados,
      bajas: a.bajas + c.bajasCapacitacion,
      enCapacitacion: a.enCapacitacion + c.enCapacitacion,
      desercion: a.desercion + c.desercion,
      sinClasificar: a.sinClasificar + c.sinClasificar,
      finalizados: a.finalizados + c.finalizados,
    }),
    { asignados: 0, inician: 0, aprobados: 0, bajas: 0, enCapacitacion: 0, desercion: 0, sinClasificar: 0, finalizados: 0 },
  );

  for (const c of capacitadores) {
    // VALIDACIÓN 1 (por capacitador)
    assert.strictEqual(
      c.inicianCapacitacion,
      c.aprobados + c.bajasCapacitacion + c.enCapacitacion,
      `${name}/${c.capacitador}: Inician != Aprobados + Bajas + EnCap`,
    );
    // VALIDACIÓN 2 (por capacitador)
    assert.strictEqual(
      c.asignados,
      c.desercion + c.inicianCapacitacion + c.sinClasificar,
      `${name}/${c.capacitador}: Total != Desercion + Inician + SinClasificar`,
    );
    assert.strictEqual(c.finalizados, c.aprobados + c.bajasCapacitacion, `${name}/${c.capacitador}: Finalizados`);
  }

  // Los totales por capacitador deben coincidir con los KPIs globales.
  const k = computeKpis(records);
  assert.strictEqual(totals.asignados, k.totalIngresos, `${name}: asignados != KPIs.totalIngresos`);
  assert.strictEqual(totals.inician, k.inicianCapacitacion, `${name}: inician != KPIs.inicianCapacitacion`);
  assert.strictEqual(totals.aprobados, k.pasanAOperaciones, `${name}: aprobados != KPIs.pasanAOperaciones`);
  assert.strictEqual(totals.bajas, k.bajasCapacitacion, `${name}: bajas != KPIs.bajasCapacitacion`);
  assert.strictEqual(totals.enCapacitacion, k.enCapacitacion, `${name}: enCapacitacion != KPIs.enCapacitacion`);
  assert.strictEqual(totals.desercion, k.desercion, `${name}: desercion != KPIs.desercion`);
  assert.strictEqual(totals.sinClasificar, k.sinClasificar, `${name}: sinClasificar != KPIs.sinClasificar`);

  for (const [key, value] of Object.entries(expect)) {
    assert.strictEqual(totals[key], value, `${name}: ${key} = ${totals[key]}, esperado ${value}`);
  }

  console.log(
    `OK  ${name.padEnd(34)} total=${totals.asignados} inici=${totals.inician} des=${totals.desercion} ` +
      `aprob=${totals.aprobados} bajas=${totals.bajas} enCap=${totals.enCapacitacion} sinClas=${totals.sinClasificar} ` +
      `excluidos=${registrosExcluidos} | %aprob=${k.porcentajeAprobacion.toFixed(1)}`,
  );
  return totals;
}

check('vacío', [], { asignados: 0, inician: 0, enCapacitacion: 0 });

check('EN CAPACITACIÓN pura', [r(2, null), r(9, null), r(1, null)], {
  asignados: 3,
  inician: 3,
  enCapacitacion: 3,
  aprobados: 0,
  bajas: 0,
  finalizados: 0,
});

check('todo aprobado', [r(5, 1), r(1, 1)], { asignados: 2, inician: 2, aprobados: 2, enCapacitacion: 0 });

check('todo baja', [r(3, 0), r(1, 0)], { asignados: 2, inician: 2, bajas: 2, enCapacitacion: 0 });

check('deserción pura', [r(0, 0), r(0, 0)], { asignados: 2, inician: 0, desercion: 2 });

check('sin clasificar', [r(null, 0), r(null, null), r(0, 1), r(4, 1)], {
  asignados: 4,
  inician: 1,
  sinClasificar: 3,
  aprobados: 1,
});

// Multi-capacitador: la partición debe cerrar en cada uno por separado.
const multi = [
  r(5, 1, { capacitador: 'ANA' }),
  r(3, 0, { capacitador: 'ANA' }),
  r(2, null, { capacitador: 'ANA' }),
  r(0, 0, { capacitador: 'ANA' }),
  r(4, 1, { capacitador: 'BRUNO/LUANA' }),
  r(0, 0, { capacitador: 'BRUNO/LUANA' }),
  r(6, null, { capacitador: 'CARLOS' }),
  r(0, 0, { capacitador: 'CARLOS' }),
  r(0, 0, { capacitador: 'CARLOS' }),
];
check('multi capacitador', multi, {
  asignados: 9,
  inician: 5,
  aprobados: 2,
  bajas: 1,
  enCapacitacion: 2,
  desercion: 4,
  sinClasificar: 0,
});

const { capacitadores } = analizarCapacitadores(multi);
assert.deepStrictEqual(
  capacitadores.map((c) => c.capacitador),
  ['ANA', 'CARLOS', 'BRUNO/LUANA'],
  'orden por asignados desc',
);
const ana = capacitadores.find((c) => c.capacitador === 'ANA');
assert.strictEqual(ana.asignados, 4);
assert.strictEqual(ana.inicianCapacitacion, 3);
assert.strictEqual(ana.enCapacitacion, 1);

// Caso real: 707 ingresos / 660 iniciaron / 47 deserción, repartido en 2 capacitadores.
const bulk = [
  ...Array.from({ length: 400 }, () => r(5, 1, { capacitador: 'ANA' })),
  ...Array.from({ length: 60 }, () => r(2, 0, { capacitador: 'ANA' })),
  ...Array.from({ length: 100 }, () => r(3, null, { capacitador: 'ANA' })),
  ...Array.from({ length: 40 }, () => r(4, 1, { capacitador: 'BRUNO' })),
  ...Array.from({ length: 40 }, () => r(2, 0, { capacitador: 'BRUNO' })),
  ...Array.from({ length: 20 }, () => r(3, null, { capacitador: 'BRUNO' })),
  ...Array.from({ length: 47 }, () => r(0, 0, { capacitador: 'BRUNO' })),
];
const bt = check('707 ingresos / 660 iniciaron', bulk, {
  asignados: 707,
  inician: 660,
  aprobados: 440,
  bajas: 100,
  enCapacitacion: 120,
  desercion: 47,
  sinClasificar: 0,
});
assert.strictEqual(bt.desercion + bt.inician, 707);
assert.strictEqual(bt.aprobados + bt.bajas + bt.enCapacitacion, bt.inician);

console.log('\nTodas las validaciones por capacitador pasaron.');
