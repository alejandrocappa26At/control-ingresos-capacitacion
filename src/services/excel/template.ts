'use client';

import { saveAs } from 'file-saver';
import { REQUIRED_COLUMNS, REQUIRED_SHEETS, ASISTENCIA_COLUMNS } from '@/lib/constants';
import { loadXlsxModule } from '@/services/excel/reader';

type Row = string[];

function sampleRow({
  jurisdiccion,
  zona,
  sede,
  distrito,
  tienda,
  supervisor,
  responsable,
  dni,
  nombre,
  modalidad,
  capacitador,
  inicio,
}: {
  jurisdiccion: string;
  zona: string;
  sede: string;
  distrito: string;
  tienda: string;
  supervisor: string;
  responsable: string;
  dni: string;
  nombre: string;
  modalidad: string;
  capacitador: string;
  inicio: string;
}): Row {
  return [
    jurisdiccion,
    inicio,
    zona,
    sede,
    distrito,
    tienda,
    supervisor,
    responsable,
    dni,
    nombre,
    modalidad,
    capacitador,
    inicio,
    '',
    '',
    ...Array.from({ length: 10 }, (_, d) => (d < 6 ? '1' : d < 8 ? '0' : '')),
    '1',
    '—',
    '—',
  ];
}

export async function generarPlantilla() {
  const XLSX = await loadXlsxModule();
  const header: Row = [...REQUIRED_COLUMNS];

  const limaRows: Row[] = [
    sampleRow({
      jurisdiccion: 'LIMA',
      zona: 'CENTRO',
      sede: 'LIMA CENTRO',
      distrito: 'CERCADO DE LIMA',
      tienda: 'TIENDA CENTRO 01',
      supervisor: 'JORGE RAMIREZ',
      responsable: 'ANA CASTILLO',
      dni: '71425369',
      nombre: 'HERRERA VELIZ, MARIA FERNANDA',
      modalidad: 'PRESENCIAL',
      capacitador: 'LUIS TORRES',
      inicio: '01/09/2026',
    }),
    sampleRow({
      jurisdiccion: 'LIMA',
      zona: 'NORTE',
      sede: 'LIMA NORTE',
      distrito: 'LOS OLIVOS',
      tienda: 'TIENDA NORTE 03',
      supervisor: 'CARLOS MENDOZA',
      responsable: 'PEDRO SANCHEZ',
      dni: '72658410',
      nombre: 'QUISPE RAMOS, CARLOS ALBERTO',
      modalidad: 'VIRTUAL',
      capacitador: 'LUIS TORRES',
      inicio: '01/09/2026',
    }),
    sampleRow({
      jurisdiccion: 'LIMA',
      zona: 'SUR',
      sede: 'LIMA SUR',
      distrito: 'VILLA EL SALVADOR',
      tienda: 'TIENDA SUR 05',
      supervisor: 'ROSA FLORES',
      responsable: 'ANA CASTILLO',
      dni: '73514862',
      nombre: 'GOMEZ LUYO, PAOLA CRISTINA',
      modalidad: 'PRESENCIAL',
      capacitador: 'KAREN VILLANUEVA',
      inicio: '15/08/2026',
    }),
  ];

  const provinciaRows: Row[] = [
    sampleRow({
      jurisdiccion: 'PROVINCIA',
      zona: 'NORTE PAÍS',
      sede: 'CHICLAYO',
      distrito: 'CHICLAYO',
      tienda: 'TIENDA CHICLAYO 02',
      supervisor: 'MIGUEL RAMOS',
      responsable: 'SANDRA LUNA',
      dni: '72894561',
      nombre: 'DIAZ PURIZACA, JOSE ADRIAN',
      modalidad: 'PRESENCIAL',
      capacitador: 'HECTOR SALAS',
      inicio: '01/09/2026',
    }),
    sampleRow({
      jurisdiccion: 'PROVINCIA',
      zona: 'SUR PAÍS',
      sede: 'AREQUIPA',
      distrito: 'AREQUIPA',
      tienda: 'TIENDA AREQUIPA 01',
      supervisor: 'LUCIA PAREDES',
      responsable: 'SANDRA LUNA',
      dni: '74125698',
      nombre: 'SALAZAR CONDORI, VALERIA MILAGROS',
      modalidad: 'VIRTUAL',
      capacitador: 'HECTOR SALAS',
      inicio: '20/08/2026',
    }),
  ];

  const sheets: Array<[string, string[][]]> = REQUIRED_SHEETS.map((name) => [
    name,
    [header, ...(name === 'CAPACITACIÓN LIMA' ? limaRows : provinciaRows)],
  ]);

  const workbook = XLSX.utils.book_new();
  for (const [name, rows] of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = header.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(workbook, ws, name);
  }

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    'plantilla_capacitacion.xlsx',
  );
}

export { ASISTENCIA_COLUMNS };