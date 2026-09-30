import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Crypto from 'expo-crypto';
import { HashTable, hashString } from '../lib/hashTable';
import { Row, estimateBigO, runBenchmark } from '../lib/benchmark';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export default function HashScreen() {
  const [text, setText] = useState('');
  const [sha, setSha] = useState('');
  const [bucket, setBucket] = useState<number | null>(null);
  const [tMs, setTMs] = useState<number | null>(null);
  const [table] = useState(() => new HashTable<string>(16));
  const [tableInfo, setTableInfo] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [bigOHash, setBigOHash] = useState('');
  const [bigOLinear, setBigOLinear] = useState('');
  const [loading, setLoading] = useState(false);

  const calcular = async () => {
    // 1) SHA-256 con medición de T
    const t0 = now();
    const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
    const t1 = now();
    setSha(digest);
    setTMs(t1 - t0);

    // 2) Hash propio (djb2) + inserción en la tabla hash
    setBucket(hashString(text, table.size));
    table.set(text, digest);
    const s = table.stats();
    setTableInfo(
      `Elementos: ${s.count} | Tamaño: ${s.size} | Factor de carga: ${s.loadFactor.toFixed(2)} | Cadena más larga: ${s.longestChain}`
    );
  };

  const analizar = () => {
    setLoading(true);
    // setTimeout para que se pinte el spinner antes de bloquear el hilo JS
    setTimeout(() => {
      const r = runBenchmark();
      setRows(r);
      setBigOHash(estimateBigO(r.map((x) => x.tHash)));
      setBigOLinear(estimateBigO(r.map((x) => x.tLinear)));
      setLoading(false);
    }, 50);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Hashing: T(n) y Big O</Text>

        <TextInput
          style={styles.input}
          placeholder="Escribe un texto"
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable style={styles.btn} onPress={calcular}>
          <Text style={styles.btnText}>Calcular hash</Text>
        </Pressable>

        {sha !== '' && (
          <View style={styles.card}>
            <Text style={styles.label}>SHA-256</Text>
            <Text selectable style={styles.mono}>{sha}</Text>
            <Text style={styles.label}>Bucket (djb2 % {table.size})</Text>
            <Text style={styles.value}>{bucket}</Text>
            <Text style={styles.label}>Tiempo de ejecución T</Text>
            <Text style={styles.value}>{tMs?.toFixed(3)} ms</Text>
            <Text style={styles.label}>Big O</Text>
            <Text style={styles.value}>O(n) en la longitud del texto (n = {text.length})</Text>
            <Text style={styles.small}>{tableInfo}</Text>
            <Text style={styles.small}>
              Tabla hash: insertar/buscar = O(1) promedio, O(n) peor caso.
            </Text>
          </View>
        )}

        <Pressable style={[styles.btn, styles.btn2]} onPress={analizar} disabled={loading}>
          <Text style={styles.btnText}>Analizar T(n) y Big O (benchmark)</Text>
        </Pressable>
        {loading && <ActivityIndicator style={{ marginTop: 12 }} />}

        {rows.length > 0 && (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.cell, styles.bold]}>n</Text>
              <Text style={[styles.cell, styles.bold]}>Hash (ms)</Text>
              <Text style={[styles.cell, styles.bold]}>Lineal (ms)</Text>
            </View>
            {rows.map((r) => (
              <View key={r.n} style={styles.row}>
                <Text style={styles.cell}>{r.n}</Text>
                <Text style={styles.cell}>{r.tHash.toFixed(4)}</Text>
                <Text style={styles.cell}>{r.tLinear.toFixed(4)}</Text>
              </View>
            ))}
            <Text style={styles.label}>Big O estimado (búsqueda)</Text>
            <Text style={styles.value}>Tabla hash: {bigOHash}</Text>
            <Text style={styles.value}>Búsqueda lineal: {bigOLinear}</Text>
            <Text style={styles.small}>
              Se duplica n y se compara cuánto crece T: si casi no cambia es O(1); si se duplica es O(n).
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5f7' },
  container: { padding: 20, paddingTop: 48 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#d0d4da',
    textAlignVertical: 'top',
  },
  btn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10, marginTop: 12, alignItems: 'center' },
  btn2: { backgroundColor: '#0f766e', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16 },
  label: { fontSize: 12, color: '#6b7280', marginTop: 10 },
  value: { fontSize: 16, fontWeight: '600' },
  mono: { fontFamily: 'Courier', fontSize: 12 },
  small: { fontSize: 12, color: '#4b5563', marginTop: 8 },
  row: { flexDirection: 'row', paddingVertical: 4 },
  cell: { flex: 1, fontSize: 13 },
  bold: { fontWeight: '700' },
});
