import XLSX from 'xlsx';
import { readFileSync } from 'node:fs';

const [,, ...paths] = process.argv;
function norm(s) {
  return String(s).toUpperCase().replace(/[ÁÀÂÃÄ]/g, 'A').replace(/[ÉÈÊË]/g, 'E').replace(/[ÍÌÎÏ]/g, 'I').replace(/[ÓÒÔÕÖ]/g, 'O').replace(/[ÚÙÛÜ]/g, 'U').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}
for (const p of paths) {
  try {
    const wb = XLSX.read(readFileSync(p), { type: 'buffer' });
    const names = wb.SheetNames.map(norm);
    let dataRows = 0;
    if (names.includes('CAPACITACION LIMA')) {
      const ws = wb.Sheets[wb.SheetNames.find((n) => norm(n) === 'CAPACITACION LIMA')];
      dataRows += ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']).e.r : 0;
    }
    if (names.includes('CAPACITACION PROVINCIA')) {
      const ws = wb.Sheets[wb.SheetNames.find((n) => norm(n) === 'CAPACITACION PROVINCIA')];
      dataRows += ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']).e.r : 0;
    }
    console.log(`${p.split('\\').pop()} :: hojas=${names.length} :: filasAprox=${dataRows}`);
  } catch {
    console.log(`${p.split('\\').pop()} :: ERROR`);
  }
}