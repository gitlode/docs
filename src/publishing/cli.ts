import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { acquire, stage } from './pipeline.ts';
import type { Publication, Sources } from './pipeline.ts';

try {
  const root = resolve(import.meta.dirname, '../..');
  const sources: Sources = JSON.parse(readFileSync(resolve(root, 'config/sources.json'), 'utf8'));
  switch (process.argv[2]) {
    case 'acquire': acquire(root, sources); break;
    case 'stage': {
      const publication: Publication = JSON.parse(readFileSync(resolve(root, 'config/publication.json'), 'utf8'));
      console.log(stage(root, sources, publication));
      break;
    }
    default: throw new Error('Usage: npm run source:acquire | npm run content:stage');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
