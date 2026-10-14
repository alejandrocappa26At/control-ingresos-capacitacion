import assert from 'node:assert';
import {
  ROLES,
  PERMISOS_LABEL,
  homePath,
  permisoParaPath,
  puedeAcceder,
} from '../src/lib/rbac.ts';
import { signSessionToken, verifySessionToken, SESSION_COOKIE, SESSION_DURATION_MS } from '../src/server/auth/session.ts';
import { verifyPassword } from '../src/server/auth/passwords.ts';
import { USUARIOS, findUsuario } from '../src/server/auth/users.ts';

// ══════════════════════════════════════════════════════════════════
//  1) ROLES EXACTOS SEGÚN ESPECIFICACIÓN DE NEGOCIO
// ══════════════════════════════════════════════════════════════════
assert.deepStrictEqual(
  [...ROLES.GERENTE_VENTAS.permisos].sort(),
  ['caidas', 'capacitacion', 'dashboard', 'reclutadores', 'upload_excel'],
  'GERENTE_VENTAS: acceso completo',
);
assert.deepStrictEqual(
  [...ROLES.CAPACITACION.permisos].sort(),
  ['capacitacion', 'upload_excel'],
  'CAPACITACION: solo capacitación + carga Excel',
);
assert.deepStrictEqual(
  [...ROLES.GDT.permisos].sort(),
  ['caidas', 'dashboard', 'upload_excel'],
  'GDT: dashboard + caídas + carga Excel',
);

// Ningún rol no autorizado ve módulos ajenos
assert.ok(!ROLES.CAPACITACION.permisos.includes('dashboard'), 'CAPACITACION sin dashboard');
assert.ok(!ROLES.CAPACITACION.permisos.includes('caidas'), 'CAPACITACION sin caídas (ni matriz de reclutadores)');
assert.ok(!ROLES.GDT.permisos.includes('capacitacion'), 'GDT sin capacitación');
assert.ok(!ROLES.GDT.permisos.includes('reclutadores'), 'GDT sin permiso explícito de reclutadores');

// ══════════════════════════════════════════════════════════════════
//  2) MAPEO RUTA ↔ PERMISO Y RUTA INICIAL
// ══════════════════════════════════════════════════════════════════
assert.strictEqual(permisoParaPath('/'), 'dashboard');
assert.strictEqual(permisoParaPath('/capacitacion'), 'capacitacion');
assert.strictEqual(permisoParaPath('/caidas'), 'caidas');
assert.strictEqual(permisoParaPath('/upload'), 'upload_excel');
assert.strictEqual(permisoParaPath('/login'), null, '/login es pública');
assert.strictEqual(permisoParaPath('/api/auth/login'), null, '/api no requiere permiso de módulo');

assert.strictEqual(homePath('GERENTE_VENTAS'), '/');
assert.strictEqual(homePath('CAPACITACION'), '/capacitacion', 'CAPACITACION aterriza en su único módulo');
assert.strictEqual(homePath('GDT'), '/');

assert.ok(puedeAcceder('GDT', 'caidas'), 'GDT accede a caídas');
assert.ok(!puedeAcceder('GDT', 'capacitacion'), 'GDT no accede a capacitación');
assert.ok(!puedeAcceder(null, 'dashboard'), 'sin rol no hay acceso');
assert.strictEqual(Object.keys(PERMISOS_LABEL).length, 5, 'todo permiso tiene etiqueta');

// ══════════════════════════════════════════════════════════════════
//  3) TOKEN DE SESIÓN: FIRMA, INTEGRIDAD, EXPIRACIÓN
// ══════════════════════════════════════════════════════════════════
const payload = { u: 'Mauricio.Guerra', r: 'GERENTE_VENTAS', exp: Date.now() + 1000 };
const token = await signSessionToken(payload);
const verificado = await verifySessionToken(token);
assert.strictEqual(verificado?.u, 'Mauricio.Guerra', 'round-trip del token');
assert.strictEqual(verificado?.r, 'GERENTE_VENTAS');

const [body, firma] = token.split('.');
assert.strictEqual(await verifySessionToken(`${body}.firma-falsa`), null, 'firma falsa rechazada');
assert.strictEqual(await verifySessionToken(`${body}.AAAA${firma.slice(4)}`), null, 'firma alterada rechazada');
assert.strictEqual(await verifySessionToken('token-basura'), null, 'token malformado rechazado');
assert.strictEqual(await verifySessionToken(null), null, 'token nulo rechazado');
assert.strictEqual(
  await verifySessionToken(await signSessionToken({ u: 'x', r: 'GERENTE_VENTAS', exp: Date.now() - 1 })),
  null,
  'token expirado rechazado',
);
assert.strictEqual(
  await verifySessionToken(await signSessionToken({ u: 'x', r: 'ROL_FANTASMA', exp: Date.now() + 1000 })),
  null,
  'rol inexistente rechazado',
);
assert.strictEqual(SESSION_COOKIE, 'cic_session', 'nombre de cookie estable');
assert.ok(SESSION_DURATION_MS > 0, 'duración de sesión definida');

// ══════════════════════════════════════════════════════════════════
//  4) USUARIOS Y CONTRASEÑAS (hash scrypt, jamás texto plano)
// ══════════════════════════════════════════════════════════════════
assert.strictEqual(USUARIOS.length, 3, 'exactamente3 usuarios');
for (const u of USUARIOS) {
  assert.ok(u.passwordHash.startsWith('scrypt$'), `${u.username}: hash scrypt`);
  assert.ok(!/[{}]|contraseña|password[:=]/i.test(u.passwordHash), `${u.username}: hash sin texto plano`);
  assert.notStrictEqual(u.username.toLowerCase(), u.passwordHash.toLowerCase(), 'username ≠ hash');
}
assert.strictEqual(findUsuario('  mauricio.guerra ')?.role, 'GERENTE_VENTAS', 'login case-insensitive + trim');
assert.strictEqual(findUsuario('Capacitacion.At')?.role, 'CAPACITACION');
assert.strictEqual(findUsuario('Gdt.At')?.role, 'GDT');
assert.strictEqual(findUsuario('no.existe'), null, 'usuario inexistente → null');

// Verificación de hashes: NO se prueban contraseñas en claro (no existen en
// el repo); se valida que la verificación rechace cualquier password ajena
// y que el formato sea correcto.
for (const u of USUARIOS) {
  assert.ok(verifyPassword('password-de-prueba-incorrecta', u.passwordHash) === false, `${u.username}: rechaza password incorrecta`);
  assert.ok(verifyPassword('', u.passwordHash) === false, `${u.username}: rechaza vacía`);
}
assert.ok(verifyPassword('x', ' formato-invalido ') === false, 'hash corrupto rechazado sin lanzar');

// Verificación POSITIVA opcional: si se exportan las credenciales de prueba
// por variables de entorno (nunca en el repo), se valida que cada hash
// corresponde exactamente a la contraseña de su usuario.
const PASS_ENV = {
  'Mauricio.Guerra': process.env.CIC_PASS_GERENTE,
  'Capacitacion.At': process.env.CIC_PASS_CAP,
  'Gdt.At': process.env.CIC_PASS_GDT,
};
const conEnv = USUARIOS.filter((u) => PASS_ENV[u.username]);
if (conEnv.length === USUARIOS.length) {
  for (const u of USUARIOS) {
    assert.ok(verifyPassword(PASS_ENV[u.username], u.passwordHash), `${u.username}: hash corresponde a su contraseña`);
  }
  console.log('   (+ verificación positiva de los3 hashes con CIC_PASS_*)');
} else {
  console.log('   (CIC_PASS_* no definidas: verificación positiva de hashes omitida)');
}

console.log(
  'OK check-rbac: roles, mapeo rutas/permisos, tokens firmados (integridad/expiración) y directorio de usuarios scrypt.',
);
