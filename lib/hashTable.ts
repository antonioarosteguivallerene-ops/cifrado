// Función hash djb2: recorre los n caracteres de la clave -> O(n) en la longitud de la clave
export function hashString(key: string, size: number): number {
  let h = 5381;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % size;
}

// Tabla hash con encadenamiento (cada bucket es una lista)
export class HashTable<V> {
  private buckets: Array<Array<[string, V]>>;
  count = 0;

  constructor(public size = 16) {
    this.buckets = Array.from({ length: size }, () => []);
  }

  // Promedio O(1), peor caso O(n) (todas las claves en un mismo bucket)
  set(key: string, value: V): void {
    const bucket = this.buckets[hashString(key, this.size)];
    for (const entry of bucket) {
      if (entry[0] === key) {
        entry[1] = value;
        return;
      }
    }
    bucket.push([key, value]);
    this.count++;
    if (this.count / this.size > 0.75) this.resize();
  }

  // Promedio O(1), peor caso O(n)
  get(key: string): V | undefined {
    const bucket = this.buckets[hashString(key, this.size)];
    for (const entry of bucket) {
      if (entry[0] === key) return entry[1];
    }
    return undefined;
  }

  // Promedio O(1), peor caso O(n)
  delete(key: string): boolean {
    const bucket = this.buckets[hashString(key, this.size)];
    const i = bucket.findIndex((e) => e[0] === key);
    if (i === -1) return false;
    bucket.splice(i, 1);
    this.count--;
    return true;
  }

  // O(n): se reinsertan todas las claves (se amortiza a O(1) por inserción)
  private resize(): void {
    const old = this.buckets;
    this.size *= 2;
    this.buckets = Array.from({ length: this.size }, () => []);
    this.count = 0;
    for (const bucket of old) for (const [k, v] of bucket) this.set(k, v);
  }

  stats() {
    let longest = 0;
    let used = 0;
    for (const b of this.buckets) {
      if (b.length > 0) used++;
      if (b.length > longest) longest = b.length;
    }
    return {
      size: this.size,
      count: this.count,
      loadFactor: this.count / this.size,
      usedBuckets: used,
      longestChain: longest,
    };
  }
}
