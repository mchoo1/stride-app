import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const GOALS = [
  { key: 'weight_loss',   label: 'Lose Weight',     icon: 'trending-down-outline', color: '#FF6B6B' },
  { key: 'muscle_gain',   label: 'Build Muscle',     icon: 'barbell-outline',       color: '#4A90D9' },
  { key: 'maintenance',   label: 'Maintain Weight',  icon: 'pulse-outline',         color: '#4CAF82' },
];

export default function ProfileScreen({ navigation }) {
  const { state, updateProfile } = useApp();
  const [form, setForm] = useState({ ...state.profile });

  const handleSave = () => {
    updateProfile({
      name:          form.name,
      goalCalories:  Number(form.goalCalories),
      goalProtein:   Number(form.goalProtein),
      goalCarbs:     Number(form.goalCarbs),
      goalFat:       Number(form.goalFat),
      goal:          form.goal,
    });
    Alert.alert('Saved!', 'Your profile has been updated.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Goals</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Name ── */}
        <Section title="Personal">
          <Field label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        </Section>

        {/* ── Fitness Goal ── */}
        <Section title="Fitness Goal">
          <View style={styles.goalGrid}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.goalCard, form.goal === g.key && { borderColor: g.color, backgroundColor: g.color + '11' }]}
                onPress={() => setForm({ ...form, goal: g.key })}
              >
                <Ionicons name={g.icon} size={24} color={form.goal === g.key ? g.color : '#bbb'} />
                <Text style={[styles.goalLabel, form.goal === g.key && { color: g.color }]}>{g.label}</Text>
                {form.goal === g.key && (
                  <Ionicons name="checkmark-circle" size={16} color={g.color} style={{ marginTop: 4 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* ── Daily Targets ── */}
        <Section title="Daily Targets">
          <Field
            label="Calories (kcal)"
            value={String(form.goalCalories)}
            onChangeText={(v) => setForm({ ...form, goalCalories: v })}
            keyboardType="numeric"
          />
          <View style={styles.rowFields}>
            <Field label="Protein (g)" value={String(form.goalProtein)} half
              onChangeText={(v) => setForm({ ...form, goalProtein: v })} keyboardType="numeric" />
            <Field label="Carbs (g)" value={String(form.goalCarbs)} half
              onChangeText={(v) => setForm({ ...form, goalCarbs: v })} keyboardType="numeric" />
          </View>
          <Field
            label="Fat (g)"
            value={String(form.goalFat)}
            onChangeText={(v) => setForm({ ...form, goalFat: v })}
            keyboardType="numeric"
          />
        </Section>

        {/* ── Macro split hint ── */}
        <View style={styles.hintCard}>
          <Ionicons name="information-circle-outline" size={18} color="#4A90D9" />
          <Text style={styles.hintText}>
            A common starting point:{' '}
            <Text style={{ fontWeight: '700' }}>40% carbs / 30% protein / 30% fat</Text>.
            Adjust based on your goal and how your body responds.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Field({ label, value, onChangeText, keyboardType = 'default', half }) {
  return (
    <View style={[styles.field, half && { width: '48%' }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#ccc"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#f8f9fb' },
  header: {
    backgroundColor: '#4CAF82', flexDirection: 'row', alignItems: 'center',
    paddingTop: 8, paddingBottom: 14, paddingHorizontal: 16,
  },
  backBtn:     { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#fff' },
  saveBtn:     { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10 },
  saveText:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll:      { padding: 16, paddingBottom: 40 },
  section:     { marginBottom: 20 },
  sectionTitle:{ fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  field:       { marginBottom: 14 },
  fieldLabel:  { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 6 },
  fieldInput:  { backgroundColor: '#f5f7fa', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#333' },
  rowFields:   { flexDirection: 'row', justifyContent: 'space-between' },
  goalGrid:    { flexDirection: 'row', gap: 10 },
  goalCard:    {
    flex: 1, borderRadius: 14, borderWidth: 2, borderColor: '#eee',
    padding: 12, alignItems: 'center', backgroundColor: '#fafafa',
  },
  goalLabel:   { fontSize: 11, fontWeight: '700', color: '#bbb', textAlign: 'center', marginTop: 6 },
  hintCard:    {
    flexDirection: 'row', backgroundColor: '#EBF3FD', borderRadius: 12,
    padding: 14, gap: 10, alignItems: 'flex-start',
  },
  hintText:    { flex: 1, fontSize: 13, color: '#5A7FA8', lineHeight: 20 },
});
