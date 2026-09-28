import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const SRC = pathToFileURL(path.resolve(import.meta.dirname, '..', 'src')).href;

export async function resolve(specifier, context, nextResolve) {
  // Alias de Next.js: "@/lib/utils" -> "<raiz>/src/lib/utils"
  if (specifier.startsWith('@/')) {
    const rest = specifier.slice(2);
    for (const suffix of ['', '.ts', '/index.ts']) {
      try {
        return await nextResolve(`${SRC}/${rest}${suffix}`, context);
      } catch {
        /* siguiente candidato */
      }
    }
  }

  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      for (const suffix of ['.ts', '/index.ts']) {
        try {
          return await nextResolve(specifier + suffix, context);
        } catch {
          /* siguiente candidato */
        }
      }
    }
    throw err;
  }
}
