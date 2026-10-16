/**
 * Directorio de usuarios — SOLO servidor (nunca importar desde cliente).
 *
 * Las contraseñas se almacenan como hashes scrypt; el texto plano no
 * existe en el código. Para dar de alta un usuario: ejecutar
 * scripts/gen-user-hash.mjs y pegar el hash resultante aquí.
 */

import type { Rol } from '@/lib/rbac';

export interface Usuario {
  /** Username exacto (el login ignora mayúsculas/minúsculas y espacios). */
  username: string;
  /** Nombre visible en la UI. */
  displayName: string;
  role: Rol;
  passwordHash: string;
}

export const USUARIOS: readonly Usuario[] = [
  {
    username: 'Mauricio.Guerra',
    displayName: 'Mauricio Guerra',
    role: 'GERENTE_VENTAS',
    passwordHash:
      'scrypt$16384$8$1$949d85da908ac834b18424ad07b4cd42$7d07e7bda1c0371d131d7b9fe5288c9ef7ea1f67afb95729e140b92811423cacdaca26449cb3cd7122abad080468ebd62bf21047d88c55593db2ae6ccff8543c',
  },
  {
    username: 'Capacitacion.At',
    displayName: 'Capacitación AT',
    role: 'CAPACITACION',
    passwordHash:
      'scrypt$16384$8$1$49f7010284dcf0960b436a7bf1a57c95$5aae959138bad5bee14bb898b61400986601589260c551f87f3fd9979eb539c5500e602d1f848d9d7ceb78ee84af667f0cf22c98e1c6984b4a01fea213766114',
  },
  {
    username: 'Gdt.At',
    displayName: 'GDT AT',
    role: 'GDT',
    passwordHash:
      'scrypt$16384$8$1$acc9c3ebb4c6bee1454efb00badb3bbe$3149769cabf02b6a3d916508258e723953f1b843a4149c5a59365c45ec471a4442c777a8e02fedb9800e4adf1c121dd7a7ec68697011f1e93f679b3f7f7caf84',
  },
  {
    username: 'Tatiana.Patricia',
    displayName: 'Jefa de Capacitación',
    role: 'JEFA_CAPACITACION',
    passwordHash:
      'scrypt$16384$8$1$c6d1199bb3251b4eddf07ec228f05ac6$5e9b7aabf21ad3a131b0a9f9f3e0a609448d24aab3b93239eb3bce0e8573f1661032bc32a349dc35b19a9bf28216182a92585cd8dde838d157fb7da8c387168e',
  },
  {
    username: 'Hiroshi.Shimatsu',
    displayName: 'Hiroshi Shimatsu',
    role: 'GERENTE_VENTAS',
    passwordHash:
      'scrypt$16384$8$1$f0781dfcd1398efdb6b915bf4fb6874a$ffaa7054c1204718e9d4fe08c5271c00e684b9700304ad272699650c1415a273229e49d92290bb6c7c5e78f902e00534b7797e14f33a110eebee238dfdfc5714',
  },
];

/** Busca por username sin distinguir mayúsculas ni espacios extremos. */
export function findUsuario(username: string): Usuario | null {
  const query = username.trim().toLowerCase();
  if (!query) return null;
  return USUARIOS.find((u) => u.username.toLowerCase() === query) ?? null;
}
