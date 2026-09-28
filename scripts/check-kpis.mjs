import assert from 'node:assert';
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
  const k = computeKpis(records);

  // VALIDACIÓN 1: INICIAN = APROBADOS + BAJAS + EN CAPACITACIÓN
  assert.strictEqual(
    k.inicianCapacitacion,
    k.pasanAOperaciones + k.bajasCapacitacion + k.enCapacitacion,
    `${name}: Inician != Aprobados + Bajas + EnCap`,
  );
  // VALIDACIÓN 2: TOTAL = DESERCIÓN + INICIAN
  assert.strictEqual(
    k.totalIngresos,
    k.desercion + k.inicianCapacitacion + k.sinClasificar,
    `${name}: Total != Desercion + Inician + sinClasificar`,
  );
  // FINALIZADOS = APROBADOS + BAJAS
  assert.strictEqual(
    k.capacitacionFinalizada,
    k.pasanAOperaciones + k.bajasCapacitacion,
    `${name}: Finalizada != Aprobados + Bajas`,
  );
  // APROBADOS ⊂ FINALIZADOS
  assert.ok(k.pasanAOperaciones <= k.capacitacionFinalizada, `${name}: Aprobados > Finalizada`);

  for (const [key, value] of Object.entries(expect)) {
    assert.strictEqual(k[key], value, `${name}: ${key} = ${k[key]}, esperado ${value}`);
  }

  console.log(
    `OK  ${name.padEnd(32)} total=${k.totalIngresos} inici=${k.inicianCapacitacion} ` +
      `des=${k.desercion} aprob=${k.pasanAOperaciones} bajas=${k.bajasCapacitacion} ` +
      `enProc=${k.enCapacitacion} final=${k.capacitacionFinalizada} sinClas=${k.sinClasificar} | ` +
      `%aprob=${k.porcentajeAprobacion.toFixed(1)}`,
  );
  return k;
}

check('vacío', [], { totalIngresos: 0, inicianCapacitacion: 0, porcentajeAprobacion: 0 });

check('desercion: 0 dias + pasa=0', [r(0, 0), r(0, 0)], {
  totalIngresos: 2,
  desercion: 2,
  inicianCapacitacion: 0,
  porcentajeDesercion: 100,
});

check('iniciaron + aprobaron', [r(5, 1), r(1, 1)], {
  inicianCapacitacion: 2,
  pasanAOperaciones: 2,
  capacitacionFinalizada: 2,
  porcentajeAprobacion: 100,
});

check('iniciaron + bajas', [r(3, 0), r(1, 0)], {
  inicianCapacitacion: 2,
  bajasCapacitacion: 2,
  capacitacionFinalizada: 2,
  porcentajeBajas: 100,
  porcentajeAprobacion: 0,
});

check('en capacitacion (pasa vacio)', [r(2, null), r(9, null)], {
  inicianCapacitacion: 2,
  enCapacitacion: 2,
  capacitacionFinalizada: 0,
  porcentajeAprobacion: 0,
});

check('mixto completo', [r(0, 0), r(0, 0), r(5, 1), r(2, 0), r(3, null)], {
  totalIngresos: 5,
  desercion: 2,
  inicianCapacitacion: 3,
  pasanAOperaciones: 1,
  bajasCapacitacion: 1,
  enCapacitacion: 1,
  capacitacionFinalizada: 2,
  sinClasificar: 0,
  porcentajeAprobacion: (1 / 3) * 100,
  porcentajeBajas: (1 / 3) * 100,
  porcentajeDesercion: 40,
});

check('totalDias null -> sin clasificar', [r(null, 0), r(null, null), r(4, 1)], {
  totalIngresos: 3,
  desercion: 0,
  inicianCapacitacion: 1,
  pasanAOperaciones: 1,
  sinClasificar: 2,
});

check('0 dias + pasa=1 -> sin clasificar', [r(0, 1)], {
  totalIngresos: 1,
  desercion: 0,
  inicianCapacitacion: 0,
  sinClasificar: 1,
});

// Caso real del negocio: 707 ingresos, 660 iniciaron => 47 deserción.
const bulk = [
  ...Array.from({ length: 400 }, () => r(5, 1)),
  ...Array.from({ length: 100 }, () => r(2, 0)),
  ...Array.from({ length: 160 }, () => r(3, null)),
  ...Array.from({ length: 47 }, () => r(0, 0)),
];
const k = check('707 ingresos / 660 iniciaron', bulk, {
  totalIngresos: 707,
  inicianCapacitacion: 660,
  desercion: 47,
  pasanAOperaciones: 400,
  bajasCapacitacion: 100,
  enCapacitacion: 160,
  capacitacionFinalizada: 500,
  sinClasificar: 0,
});
assert.strictEqual(k.desercion + k.inicianCapacitacion, 707);
assert.strictEqual(k.porcentajeAprobacion.toFixed(1), '60.6');
assert.strictEqual(k.porcentajeDesercion.toFixed(1), '6.6');

console.log('\nTodas las validaciones pasaron.');
