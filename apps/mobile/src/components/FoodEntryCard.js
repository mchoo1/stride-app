import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FoodEntryCard({ entry, onDelete }) {
  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      {entry.imageUri ? (
        <Image source={{ uri: entry.imageUri }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.iconPlaceholder]}>
          <Ionicons name="fast-food-outline" size={24} color="#4CAF82" />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{entry.name}</Text>
        <Text style={styles.time}>{time}</Text>
        <View style={styles.macros}>
          <MacroPill label="Cal" value={entry.calories} color="#FF6B6B" />
          <MacroPill label="P"   value={entry.protein}  color="#4A90D9" />
          <MacroPill label="C"   value={entry.carbs}    color="#F5A623" />
          <MacroPill label="F"   value={entry.fat}      color="#7ED321" />
        </View>
      </View>

      <TouchableOpacity onPress={() => onDelete(entry.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color="#ccc" />
      </TouchableOpacity>
    </View>
  );
}

function MacroPill({ label, value, color }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '22' }]}>
      <Text style={[styles.pillText, { color }]}>{label}: {value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: { width: 52, height: 52, borderRadius: 10, marginRight: 12 },
  iconPlaceholder: { backgroundColor: '#f0f9f4', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  time: { fontSize: 11, color: '#aaa', marginBottom: 5 },
  macros: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  pill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  pillText: { fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 4 },
});
