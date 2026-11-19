// Leonida Ledger — the hand-in program for the gta6-trophy-guide-01 entry.
//
// What this entry is: a static, offline guide and tracker for the 55 GTA 6
// PlayStation 5 trophies, living in app/ next to this file (index.html, a
// stylesheet, one ES module, and the trophy data in app/data/trophies.json).
// Nothing in app/ is built, bundled or fetched from the network at run time.
//
// What this program does, and nothing else:
//   1. Copies app/ and screenshots/ from this repository into the output
//      directory (the grader's /output, or MAKEFUN_OUTPUT_DIR outside it).
//   2. Writes /output/dossier.json with the vendored make.fun library, so
//      the judge reads the same summary the scorer checks byte for byte.
// The vendored library under vendor/ is the kit's copy and is left alone:
// the scorer rebuilds the dossier with its own copy and compares the two.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the folder holding this file; the output folder is
// the grader's /output, unless MAKEFUN_OUTPUT_DIR says otherwise.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps mirror the gate: at most 4 screenshots of 256 KiB each, app/ at
// most 993 files and 48 MiB, and the dossier text at most 160 KiB. An entry
// past any of them is refused here with the library's own words, exactly as
// the scorer would refuse it.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
