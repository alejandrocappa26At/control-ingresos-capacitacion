'use client';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import type { Promotor } from '@/types';
import { ESTADO_LABELS } from '@/lib/constants';

export const EXPORTABLE_COLUMNS: Array<{ key: keyof Promotor | string; label: string }> = [
  { key: 'jurisdiccion', label: 'Jurisdicción' },
  { key: 'fechaIngreso', label: 'Fecha de ingreso' },
  { key: 'zonaComercial', label: 'Zona comercial' },
  { key: 'sede', label: 'Sede' },
  { key: 'distrito', label: 'Distrito' },
  { key: 'nombreTienda', label: 'Nombre de tienda' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'responsableAS', label: 'Responsable A&S' },
  { key: 'dni', label: 'DNI' },
  { key: 'apellidosNombres', label: 'Apellidos y nombres' },
  { key: 'modalidad', label: 'Modalidad' },
  { key: 'capacitador', label: 'Capacitador' },
  { key: 'inicioCapacitacion', label: 'Inicio capacitación' },
  { key: 'finCapacitacion', label: 'Fin capacitación' },
  { key: 'entregaOperaciones', label: 'Entrega a operaciones' },
  { key: 'diasAsistidos', label: 'Días asistidos' },
  { key: 'diasFaltantes', label: 'Días faltantes' },
  { key: 'resultado', label: 'Resultado' },
  { key: 'motivoCaida', label: 'Motivo de caída' },
  { key: 'subMotivoCaida', label: 'Sub motivo de caída' },
  { key: 'estado', label: 'Estado' },
];

function buildRow(p: Promotor): Record<string, string | number> {
  const row: Record<string, string | number> = {};
  for (const col of EXPORTABLE_COLUMNS) {
    const value = p[col.key as keyof Promotor];
    if (col.key === 'resultado') {
      row[col.label] = p.resultado === 'APROBADO' ? 'Pasa a operaciones' : p.resultado === 'NO_APROBADO' ? 'No pasa' : 'Pendiente';
    } else if (col.key === 'diasAsistidos') {
      row[col.label] = p.diasAsistidos;
    } else if (col.key === 'diasFaltantes') {
      row[col.label] = p.diasFaltantes;
    } else if (col.key === 'estado') {
      row[col.label] = ESTADO_LABELS[p.estado] ?? p.estado;
    } else if (typeof value === 'string' || typeof value === 'number') {
      row[col.label] = value;
    } else {
      row[col.label] = String(value ?? '—');
    }
  }

  for (let i = 1; i <= 10; i++) {
    const value = p.asistencia[i - 1];
    row[`Asistencia día ${i}`] = value === 1 ? 'Asistió' : value === 0 ? 'No asistió' : 'Sin registro';
  }

  if (p.pasaAOperaciones === 1 || p.pasaAOperaciones === 0) {
    row['Pasa a operaciones'] = p.pasaAOperaciones === 1 ? 'Sí' : 'No';
  }

  return row;
}

function filename(extension: string): string {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `capacitacion_${stamp}.${extension}`;
}

export function exportExcel(records: Promotor[], fileName?: string): void {
  const rows = records.map(buildRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Capacitación');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(data, fileName ?? filename('xlsx'));
}

export function exportCSV(records: Promotor[], fileName?: string): void {
  const rows = records.map(buildRow);
  const csv = Papa.unparse(rows);
  const data = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(data, fileName ?? filename('csv'));
}