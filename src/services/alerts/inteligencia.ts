import type { Alerta, Promotor } from '@/types';
import { addDaysISO, diasEntre, todayISO } from '@/lib/dates';
import { promotoresRiesgoDesaprobacion } from '@/services/analytics/falls';

export function generarAlertas(records: Promotor[], kpis: { procesosFinalizados: number; noPasanAOperaciones: number }): Alerta[] {
  const alertas: Alerta[] = [];
  const hoy = todayISO();

  const bajaAsistencia = records.filter((r) => r.estado === 'EN_CAPACITACION' && r.diasAsistidos <= 3);
  if (bajaAsistencia.length > 0) {
    alertas.push({
      id: 'baja-asistencia',
      tipo: 'baja-asistencia',
      nivel: bajaAsistencia.length > 10 ? 'alta' : 'media',
      titulo: 'Baja asistencia',
      mensaje: `${bajaAsistencia.length} promotor(es) en capacitación presentan 3 o menos días de asistencia.`,
      cantidad: bajaAsistencia.length,
      recordsIds: bajaAsistencia.map((r) => r.id),
    });
  }

  const proximasFin = records.filter((r) => {
    if (r.resultado !== 'PENDIENTE') return false;
    if (!r.fechasISO.fin) return false;
    const dias = diasEntre(hoy, r.fechasISO.fin);
    return dias >= 0 && dias <= 7;
  });
  if (proximasFin.length > 0) {
    alertas.push({
      id: 'proxima-finalizacion',
      tipo: 'proxima-finalizacion',
      nivel: 'media',
      titulo: 'Próximas a finalizar',
      mensaje: `${proximasFin.length} capacitaciones finalizan en los próximos 7 días y aún no registran resultado.`,
      cantidad: proximasFin.length,
      recordsIds: proximasFin.map((r) => r.id),
    });
  }

  const pendientesEntrega = records.filter((r) => {
    if (r.resultado !== 'APROBADO') return false;
    if (r.fechasISO.entrega) return false;
    if (!r.fechasISO.fin) return true;
    return r.fechasISO.fin <= addDaysISO(hoy, -14);
  });
  if (pendientesEntrega.length > 0) {
    alertas.push({
      id: 'pendiente-entrega',
      tipo: 'pendiente-entrega',
      nivel: 'alta',
      titulo: 'Pendientes entrega a operaciones',
      mensaje: `${pendientesEntrega.length} promotor(es) aprobados aún no tienen fecha de entrega a operaciones.`,
      cantidad: pendientesEntrega.length,
      recordsIds: pendientesEntrega.map((r) => r.id),
    });
  }

  const porcCaida = kpis.procesosFinalizados > 0
    ? (kpis.noPasanAOperaciones / kpis.procesosFinalizados) * 100
    : 0;
  if (porcCaida >= 30) {
    alertas.push({
      id: 'incremento-caidas',
      tipo: 'incremento-caidas',
      nivel: 'alta',
      titulo: 'Incremento de caídas',
      mensaje: `El porcentaje de caídas alcanza ${porcCaida.toFixed(1)}% del total de procesos finalizados.`,
      cantidad: kpis.noPasanAOperaciones,
      recordsIds: caidasIds(records),
    });
  }

  const riesgoDesaprobar = promotoresRiesgoDesaprobacion(records);
  if (riesgoDesaprobar.length > 0) {
    alertas.push({
      id: 'riesgo-desaprobacion',
      tipo: 'riesgo-desaprobacion',
      nivel: riesgoDesaprobar.length > 5 ? 'alta' : 'media',
      titulo: 'Riesgo de desaprobación',
      mensaje: `${riesgoDesaprobar.length} promotor(es) con asistencia inferior a la esperada según su avance en capacitación.`,
      cantidad: riesgoDesaprobar.length,
      recordsIds: riesgoDesaprobar.map((r) => r.id),
    });
  }

  return alertas;
}

function caidasIds(records: Promotor[]): string[] {
  return records.filter((r) => r.pasaAOperaciones === 0).map((r) => r.id);
}