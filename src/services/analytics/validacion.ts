import type { Promotor } from '@/types';
import { normalizeKey, esCapacitadorGenerico } from '@/lib/utils';
import { esDesercion, esBajaCapacitacion, desercionesDe, bajasCapacitacion } from './desercionBase';
import { caidasPorMomentoSalida, caidasPorDiaPorSede, caidasPorDiaPorSupervisor } from './falls';
import { analizarDesercion } from './desercion';
import { analizarReclutadores } from './reclutadores';
import { analizarZonas } from './zonas';

const MAX_LISTA = 20;

export interface RegistroExcluido {
  id: string;
  nombre: string;
  supervisor: string;
  sede: string;
  responsableAS: string;
  capacitador: string;
  jurisdiccion: string;
  zonaComercial: string;
  fechaIngreso: string;
  totalDias: number | null;
  pasaAOperaciones: number | null;
  motivo: string;
}

export interface ChequeoDimension {
  dimension: string;
  suma: number;
  esperado: number;
  coincide: boolean;
  diferencia: number;
  excluidos: RegistroExcluido[];
}

export interface ResumenValidacionDesercion {
  totalIngresos: number;
  totalDeserciones: number;
  bajas: number;
  otros: number;
  dimensiones: ChequeoDimension[];
  ok: boolean;
}

function aExcluido(r: Promotor, motivo: string): RegistroExcluido {
  return {
    id: r.id,
    nombre: r.apellidosNombres,
    supervisor: r.supervisor,
    sede: r.sede,
    responsableAS: r.responsableAS,
    capacitador: r.capacitador,
    jurisdiccion: r.jurisdiccion,
    zonaComercial: r.zonaComercial,
    fechaIngreso: r.fechasISO.fechaIngreso || r.fechaIngreso || '',
    totalDias: r.totalDias,
    pasaAOperaciones: r.pasaAOperaciones,
    motivo,
  };
}

function logExcluidos(categoria: string, excluidos: RegistroExcluido[]) {
  if (excluidos.length === 0) return;
  console.warn(`  ${categoria}: ${excluidos.length} registro(s) excluido(s)`);
  for (const e of excluidos.slice(0, MAX_LISTA)) {
    console.warn(
      `    - ${e.nombre} | supervisor=${e.supervisor} | sede=${e.sede} | responsableAS=${e.responsableAS} | zona=${e.zonaComercial} | fechaIngreso=${e.fechaIngreso} | totalDias=${String(e.totalDias)} | pasa=${String(e.pasaAOperaciones)} | razón=${e.motivo}`,
    );
  }
  if (excluidos.length > MAX_LISTA) {
    console.warn(`    ... y ${excluidos.length - MAX_LISTA} más.`);
  }
}

function logRegistros(categoria: string, records: Promotor[]) {
  if (records.length === 0) return;
  console.warn(`  ${categoria}: ${records.length} registro(s) excluido(s)`);
  for (const r of records.slice(0, MAX_LISTA)) {
    console.warn(
      `    - ${r.apellidosNombres} | supervisor=${r.supervisor} | sede=${r.sede} | zona=${r.zonaComercial} | totalDias=${String(r.totalDias)} | pasa=${String(r.pasaAOperaciones)} | motivo caída=${r.motivoCaida}`,
    );
  }
  if (records.length > MAX_LISTA) {
    console.warn(`    ... y ${records.length - MAX_LISTA} más.`);
  }
}

/**
 * Validación cruzada de la auditoría de deserción.
 *
 * Regla de negocio (fuente de verdad, ver desercionBase.ts):
 *   DESERCIÓN = PASA A OPERACIONES = No Y TOTAL DE DÍAS = 0 (o sin registrar).
 *
 * Verifica:
 *   SUMA RESPONSABLE A&S = SUMA SUPERVISORES = SUMA TIENDAS =
 *   SUMA MOMENTO DE SALIDA = TOTAL DESERCIONES
 *
 * Si alguna visualización no suma el total, imprime en consola (warn) qué
 * registros quedan excluidos de cada dimensión y por qué motivo.
 */
export function validarConsistenciaDesercion(records: Promotor[]): ResumenValidacionDesercion {
  const totalIngresos = records.length;
  const deser = desercionesDe(records);
  const totalDeserciones = deser.length;
  const bajas = bajasCapacitacion(records);
  const otros = records.filter((r) => !esDesercion(r) && !esBajaCapacitacion(r));

  const check = (dimension: string, suma: number, excluidos: RegistroExcluido[]): ChequeoDimension => ({
    dimension,
    suma,
    esperado: totalDeserciones,
    coincide: suma === totalDeserciones,
    diferencia: totalDeserciones - suma,
    excluidos,
  });

  const sinValor = (r: Promotor, getter: (x: Promotor) => string) => {
    const k = normalizeKey(getter(r));
    return !k || k === '—';
  };
  const sinMes = (r: Promotor) => !/^\d{4}-\d{2}/.test(r.fechasISO.fechaIngreso || '');

  // ── MOMENTO DE SALIDA ──────────────────────────────────────────────
  const momento = caidasPorMomentoSalida(records);
  const sumaMomento = momento.reduce((s, d) => s + d.value, 0);
  const exclMomento = deser.filter((r) => r.totalDias != null && r.totalDias > 0);

  // ── RESPONSABLE A&S ────────────────────────────────────────────────
  const reclutadores = analizarReclutadores(records);
  const sumaResponsable = reclutadores.productividad.reduce((s, e) => s + e.deserciones, 0);
  const exclResponsable = deser
    .filter((r) => sinValor(r, (x) => x.responsableAS))
    .map((r) => aExcluido(r, 'SIN RESPONSABLE A&S'));

  // ── SUPERVISORES ───────────────────────────────────────────────────
  const supervisores = caidasPorDiaPorSupervisor(records);
  const sumaSupervisores = supervisores.reduce((s, e) => s + e.total, 0);
  const exclSupervisores = deser
    .filter((r) => sinValor(r, (x) => x.supervisor))
    .map((r) => aExcluido(r, 'SIN SUPERVISOR'));

  // ── TIENDAS (SEDE) ─────────────────────────────────────────────────
  const sedes = caidasPorDiaPorSede(records);
  const sumaTiendas = sedes.reduce((s, e) => s + e.total, 0);
  const exclTiendas = deser
    .filter((r) => sinValor(r, (x) => x.sede))
    .map((r) => aExcluido(r, 'SIN SEDE'));

  // ── MES ────────────────────────────────────────────────────────────
  const desercionMes = analizarDesercion(records);
  const sumaMes = desercionMes.tendencia.reduce((s, t) => s + t.deserciones, 0);
  const exclMes = deser.filter(sinMes).map((r) => aExcluido(r, 'FECHA DE INGRESO INVÁLIDA (no se puede asignar mes)'));

  // ── ZONA COMERCIAL ─────────────────────────────────────────────────
  const zonas = analizarZonas(records);
  const sumaZonas = zonas.porCantidad.reduce((s, z) => s + z.deserciones, 0);
  const exclZonas = deser
    .filter((r) => sinValor(r, (x) => x.zonaComercial))
    .map((r) => aExcluido(r, 'SIN ZONA COMERCIAL'));

  // ── CAPACITADOR ────────────────────────────────────────────────────
  const exclCapacitador = deser
    .filter((r) => esCapacitadorGenerico(normalizeKey(r.capacitador)))
    .map((r) => aExcluido(r, 'CAPACITADOR GENÉRICO O SIN CAPACITADOR'));
  const sumaCapacitador = totalDeserciones - exclCapacitador.length;

  const dimensiones: ChequeoDimension[] = [
    check('MOMENTO DE SALIDA', sumaMomento, exclMomento.map((r) => aExcluido(r, 'NO ES DESERCIÓN (TOTAL DE DÍAS > 0, baja de capacitación)'))),
    check('RESPONSABLE A&S', sumaResponsable, exclResponsable),
    check('SUPERVISORES', sumaSupervisores, exclSupervisores),
    check('TIENDAS (SEDE)', sumaTiendas, exclTiendas),
    check('MES', sumaMes, exclMes),
    check('ZONA COMERCIAL', sumaZonas, exclZonas),
    check('CAPACITADOR', sumaCapacitador, exclCapacitador),
  ];

  const ok = dimensiones.every((d) => d.coincide);

  // ── SALIDA EN CONSOLA ──────────────────────────────────────────────
  console.groupCollapsed(
    `[AUDITORÍA DESERCIÓN] ${totalIngresos} ingresos · ${totalDeserciones} deserciones · ${bajas.length} bajas · ${otros.length} aprobados/en proceso`,
  );

  console.log(
    'TOTAL DESERCIONES (regla única: PASA=No y TOTAL DÍAS=0 o sin registrar):',
    totalDeserciones,
  );

  for (const d of dimensiones) {
    const estado = d.coincide ? 'OK' : `NO COINCIDE (diferencia ${d.diferencia})`;
    console.log(`SUMA ${d.dimension}: ${d.suma} vs ${d.esperado} -> ${estado}`);
  }

  const ecuacion = dimensiones.filter((d) =>
    ['MOMENTO DE SALIDA', 'RESPONSABLE A&S', 'SUPERVISORES', 'TIENDAS (SEDE)'].includes(d.dimension),
  );
  const ecOk = ecuacion.every((d) => d.coincide);

  if (ecOk) {
    console.log(
      'VALIDACIÓN CRUZADA ✔ SUMA RESPONSABLE A&S = SUMA SUPERVISORES = SUMA TIENDAS = SUMA MOMENTO DE SALIDA = TOTAL DESERCIONES',
    );
  } else {
    console.warn('VALIDACIÓN CRUZADA ✘ no todas las visualizaciones suman el TOTAL DESERCIONES:');

    for (const d of ecuacion) {
      console.warn(
        `  SUMA ${d.dimension}: ${d.suma} ≠ ${d.esperado} (faltante ${d.diferencia})`,
      );
      for (const e of d.excluidos) {
        console.warn(
          `    - ${e.nombre} | supervisor=${e.supervisor} | sede=${e.sede} | responsableAS=${e.responsableAS} | zona=${e.zonaComercial} | totalDias=${String(e.totalDias)} | pasa=${String(e.pasaAOperaciones)} | razón=${e.motivo}`,
        );
      }
    }
  }

  if (!ok) {
    if (bajas.length > 0) {
      logRegistros(
        'Excluidos de las visualizaciones de deserción por ser BAJAS durante capacitación (TOTAL DE DÍAS 1-12)',
        bajas,
      );
    }
    if (otros.length > 0) {
      logRegistros(
        'Excluidos de las visualizaciones de deserción por ser APROBADOS / EN CAPACITACIÓN / PENDIENTE',
        otros,
      );
    }
    for (const d of dimensiones) {
      if (!d.coincide && d.excluidos.length > 0) {
        const porMotivo = new Map<string, RegistroExcluido[]>();
        for (const e of d.excluidos) {
          const list = porMotivo.get(e.motivo) ?? [];
          list.push(e);
          porMotivo.set(e.motivo, list);
        }
        for (const [motivo, list] of porMotivo) {
          logExcluidos(`DIMENSIÓN ${d.dimension} — ${motivo}`, list);
        }
      }
    }
  }

  console.groupEnd();

  return { totalIngresos, totalDeserciones, bajas: bajas.length, otros: otros.length, dimensiones, ok };
}