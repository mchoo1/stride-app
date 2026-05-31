import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  Modal, KeyboardAvoidingView, Platform, SafeAreaView, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import FoodEntryCard from '../components/FoodEntryCard';

// ── Common foods database for quick-add ──────────────────────────────────────
const QUICK_FOODS = [
  { name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0,  fat: 3  },
  { name: 'Brown Rice (1 cup)',     calories: 215, protein: 5,  carbs: 45, fat: 2  },
  { name: 'Egg (1 large)',          calories: 72,  protein: 6,  carbs: 1,  fat: 5  },
  { name: 'Greek Yogurt (170g)',    calories: 100, protein: 17, carbs: 6,  fat: 0  },
  { name: 'Banana (1 medium)',      calories: 105, protein: 1,  carbs: 27, fat: 0  },
  { name: 'Almonds (1 oz)',         calories: 164, protein: 6,  carbs: 6,  fat: 14 },
  { name: 'Salmon (100g)',          calories: 208, protein: 20, carbs: 0,  fat: 13 },
  { name: 'Sweet Potato (medium)',  calories: 103, protein: 2,  carbs: 24, fat: 0  },
  { name: 'Oatmeal (1 cup)',        calories: 154, protein: 6,  carbs: 28, fat: 3  },
  { name: 'Avocado (half)',         calories: 120, protein: 2,  carbs: 6,  fat: 11 },
];

const EMPTY_FORM = { name: '', calories: '', protein: '', carbs: '', fat: '' };

export default function FoodLogScreen({ navigation }) {
  const { state, addFoodEntry, removeFoodEntry } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('log'); // 'log' | 'quick'

  const todayLog = state.foodLog
    .filter((e) => new Date(e.timestamp).toDateString() === new Date().toDateString())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const filtered = QUICK_FOODS.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name || !form.calories) {
      Alert.alert('Missing info', 'Please enter at least a name and calories.');
      return;
    }
    addFoodEntry({
      name:     form.name.trim(),
      calories: Number(form.calories) || 0,
      protein:  Number(form.protein)  || 0,
      carbs:    Number(form.carbs)    || 0,
      fat:      Number(form.fat)      || 0,
    });
    setForm(EMPTY_FORM);
    setModalVisible(false);
  };

  const handleQuickAdd = (food) => {
    addFoodEntry(food);
    Alert.alert('Added!', `${food.name} has been logged.`);
  };

  const handleDelete = (id) => {
    Alert.alert('Remove entry', 'Remove this food from your log?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFoodEntry(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Log</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'log' && styles.tabActive]}
          onPress={() => setTab('log')}
        >
          <Text style={[styles.tabText, tab === 'log' && styles.tabTextActive]}>Today's Log</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'quick' && styles.tabActive]}
          onPress={() => setTab('quick')}
        >
          <Text style={[styles.tabText, tab === 'quick' && styles.tabTextActive]}>Quick Add</Text>
        </TouchableOpacity>
      </View>

      {tab === 'log' ? (
        <FlatList
          data={todayLog}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FoodEntryCard entry={item} onDelete={handleDelete} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="restaurant-outline" size={56} color="#ddd" />
              <Text style={styles.emptyTitle}>Nothing logged yet</Text>
              <Text style={styles.emptyText}>Tap + to add a meal manually{'\n'}or use Quick Add below</Text>
            </View>
          }
          contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#bbb"
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <View style={styles.quickRow}>
                <View style={styles.quickInfo}>
                  <Text style={styles.quickName}>{item.name}</Text>
                  <Text style={styles.quickMacros}>
                    {item.calories} kcal · P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleQuickAdd(item)} style={styles.quickAddBtn}>
                  <Ionicons name="add-circle" size={28} color="#4CAF82" />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </View>
      )}

      {/* ── Manual Entry Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Food Entry</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Field label="Food name *" placeholder="e.g. Grilled Chicken" value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })} />
              <View style={styles.macroRow}>
                <Field label="Calories *" placeholder="kcal" value={form.calories} keyboardType="numeric"
                  onChangeText={(v) => setForm({ ...form, calories: v })} half />
                <Field label="Protein" placeholder="g" value={form.protein} keyboardType="numeric"
                  onChangeText={(v) => setForm({ ...form, protein: v })} half />
              </View>
              <View style={styles.macroRow}>
                <Field label="Carbs" placeholder="g" value={form.carbs} keyboardType="numeric"
                  onChangeText={(v) => setForm({ ...form, carbs: v })} half />
                <Field label="Fat" placeholder="g" value={form.fat} keyboardType="numeric"
                  onChangeText={(v) => setForm({ ...form, fat: v })} half />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setForm(EMPTY_FORM); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveText}>Add Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Field({ label, placeholder, value, onChangeText, keyboardType = 'default', half }) {
  return (
    <View style={[styles.fieldWrap, half && { width: '48%' }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        placeholder={placeholder}
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
  backBtn:     { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#fff' },
  addBtn:      { padding: 4 },
  tabs:        { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab:         { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:   { borderBottomWidth: 3, borderBottomColor: '#4CAF82' },
  tabText:     { fontSize: 14, color: '#aaa', fontWeight: '600' },
  tabTextActive: { color: '#4CAF82' },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle:  { fontSize: 18, fontWeight: '700', color: '#ccc', marginTop: 12 },
  emptyText:   { fontSize: 14, color: '#ddd', textAlign: 'center', marginTop: 6, lineHeight: 22 },
  searchBox:   {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    margin: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  quickRow:    {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  quickInfo:   { flex: 1 },
  quickName:   { fontSize: 14, fontWeight: '600', color: '#333' },
  quickMacros: { fontSize: 12, color: '#aaa', marginTop: 3 },
  quickAddBtn: { padding: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:   {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '85%',
  },
  modalHandle:  { width: 40, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 20 },
  macroRow:     { flexDirection: 'row', justifyContent: 'space-between' },
  fieldWrap:    { marginBottom: 14 },
  fieldLabel:   { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 6 },
  fieldInput:   {
    backgroundColor: '#f5f7fa', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 11, fontSize: 15, color: '#333',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, paddingBottom: 8 },
  cancelBtn:    {
    flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
    borderColor: '#e0e0e0', alignItems: 'center',
  },
  cancelText:   { fontSize: 15, fontWeight: '600', color: '#999' },
  saveBtn:      { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#4CAF82', alignItems: 'center' },
  saveText:     { fontSize: 15, fontWeight: '700', color: '#fff' },
});
