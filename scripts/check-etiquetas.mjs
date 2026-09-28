const MAX_AXIS_LABEL = 24;

function initialsOf(nombre) {
  const tokens = nombre.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return '';
  if (tokens.length === 1) return tokens[0].toUpperCase();
  return `${tokens[0].toUpperCase()} ${tokens[tokens.length - 1].charAt(0).toUpperCase()}.`;
}

function recortar(texto, max = MAX_AXIS_LABEL) {
  if (texto.length <= max) return texto;
  return `${texto.slice(0, max - 1).trimEnd()}…`;
}

function etiquetaCapacitador(nombre) {
  const partes = nombre.split('/').map((p) => p.trim()).filter(Boolean);
  if (partes.length === 0) return '—';
  if (partes.length === 1) return recortar(initialsOf(partes[0]));
  const base = partes.slice(0, 2).map(initialsOf).join(' + ');
  const extra = partes.length - 2;
  return extra > 0 ? `${recortar(base, MAX_AXIS_LABEL - 3)} +${extra}` : recortar(base);
}

const esperado = [
  ['MARIA TORRES', 'MARIA T.'],
  ['ANA CALLE', 'ANA C.'],
  ['DEIVY GUTIERREZ', 'DEIVY G.'],
  ['ALEJANDRO CALISAYA', 'ALEJANDRO C.'],
  ['DEIVY GUTIERREZ / ANA CALLE', 'DEIVY G. + ANA C.'],
  ['ALEJANDRO CALISAYA / SOFIA ROCHA', 'ALEJANDRO C. + SOFIA R.'],
  ['PEDRO / LUCIA', 'PEDRO + LUCIA'],
  ['ALEJANDRO CALISAYA / SOFIA ROCHA / ANA CALLE / DEIVY GUTIERREZ', 'ALEJANDRO C. + SOFIA… +2'],
  ['', '—'],
  ['   ', '—'],
];

let fallos = 0;
for (const [entrada, out] of esperado) {
  const got = etiquetaCapacitador(entrada);
  const ok = got === out;
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK ' : 'FAIL'} ${JSON.stringify(entrada).padEnd(64)} -> ${JSON.stringify(got)}`);
}

// Truncamiento elegante: nunca debe exceder el máximo.
const largos = [
  'ALEJANDRO ALEJANDRO ALEJANDRO / SOFIA SOFIA SOFIA',
  'PEDRO / LUCIA / ANDRES / MARIO / LAURA / PABLO',
  'CARLOS MARIA DE LOS ANGELES LOPEZ',
  'SOFIA',
];
for (const c of largos) {
  const out = etiquetaCapacitador(c);
  if (out.length > MAX_AXIS_LABEL) {
    console.log(`FAIL excede el máximo (${out.length}): ${out}`);
    fallos += 1;
  } else {
    console.log(`OK  (len ${String(out.length).padStart(2)}) ${JSON.stringify(out)}`);
  }
}

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log(`\nTodas las etiquetas correctas, horizontales y <= ${MAX_AXIS_LABEL} caracteres.`);
