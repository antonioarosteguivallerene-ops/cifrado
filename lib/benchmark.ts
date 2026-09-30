import { HashTable } from './hashTable';

export type Row = {
  n: number;
  tHash: number; // ms por búsqueda en tabla hash
  tLinear: number; // ms por búsqueda lineal (array)
};

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// Mide el tiempo promedio por operación de búsqueda para distintos tamaños n
export function runBenchmark(sizes = [2000, 4000, 8000, 16000, 32000]): Row[] {
  const rows: Row[] = [];
  for (const n of sizes) {
    const table = new HashTable<number>();
    const arr: string[] = [];
    for (let i = 0; i < n; i++) {
      const k = 'clave_' + i;
      table.set(k, i);
      arr.push(k);
    }

    const LOOKUPS = 300;
    const targets: string[] = [];
    for (let i = 0; i < LOOKUPS; i++) targets.push('clave_' + Math.floor(Math.random() * n));

    let t0 = now();
    for (const k of targets) table.get(k);
    const tHash = (now() - t0) / LOOKUPS;

    t0 = now();
    for (const k of targets) arr.indexOf(k);
    const tLinear = (now() - t0) / LOOKUPS;

    rows.push({ n, tHash, tLinear });
  }
  return rows;
}

// Estima la complejidad comparando cuánto crece T al duplicar n
export function estimateBigO(times: number[]): string {
  const ratios: number[] = [];
  for (let i = 1; i < times.length; i++) {
    if (times[i - 1] > 0) ratios.push(times[i] / times[i - 1]);
  }
  if (ratios.length === 0) return 'O(1)';
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  if (avg < 1.5) return 'O(1)';
  if (avg < 2.7) return 'O(n)';
  return 'O(n²)';
}
