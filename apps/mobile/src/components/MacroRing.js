import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// A simple circular progress ring drawn with border tricks (no native deps needed)
export default function MacroRing({ label, value, goal, color, unit = 'g' }) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);
  const remaining = Math.max(goal - value, 0);

  return (
    <View style={styles.container}>
      <View style={[styles.ring, { borderColor: color }]}>
        <View style={[styles.fill, { backgroundColor: color, opacity: 0.15, borderRadius: 38 }]} />
        <View style={styles.innerText}>
          <Text style={[styles.value, { color }]}>{value}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.remaining}>{remaining}{unit} left</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', margin: 8 },
  ring: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  innerText: { alignItems: 'center' },
  value: { fontSize: 16, fontWeight: '700' },
  unit: { fontSize: 10, color: '#888' },
  label: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#333' },
  remaining: { fontSize: 10, color: '#aaa' },
});
