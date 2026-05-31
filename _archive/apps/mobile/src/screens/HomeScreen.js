import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import MacroRing from '../components/MacroRing';

const COLORS = { green: '#4CAF82', red: '#FF6B6B', blue: '#4A90D9', orange: '#F5A623', fat: '#7ED321' };

export default function HomeScreen({ navigation }) {
  const { state } = useApp();
  const { profile, todayTotals, foodLog } = state;

  const calPct    = Math.min((todayTotals.calories / profile.goalCalories) * 100, 100);
  const remaining = Math.max(profile.goalCalories - todayTotals.calories, 0);

  const todayLog = foodLog.filter(
    (e) => new Date(e.timestamp).toDateString() === new Date().toDateString()
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}, {profile.name} 👋</Text>
            <Text style={styles.subGreeting}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.avatarBtn}
          >
            <Ionicons name="person-circle-outline" size={36} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Calorie Summary Card ── */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Daily Calories</Text>
          <View style={styles.calorieRow}>
            <View style={styles.calorieMain}>
              <Text style={styles.calNumber}>{todayTotals.calories}</Text>
              <Text style={styles.calLabel}>consumed</Text>
            </View>
            <View style={styles.calorieBar}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, {
                  width: `${calPct}%`,
                  backgroundColor: calPct > 90 ? COLORS.red : COLORS.green,
                }]} />
              </View>
              <Text style={styles.calGoal}>Goal: {profile.goalCalories} kcal</Text>
            </View>
            <View style={styles.calorieRemain}>
              <Text style={[styles.calNumber, { color: remaining > 0 ? COLORS.green : COLORS.red }]}>
                {remaining}
              </Text>
              <Text style={styles.calLabel}>remaining</Text>
            </View>
          </View>
        </View>

        {/* ── Macro Rings ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Macros Today</Text>
          <View style={styles.ringRow}>
            <MacroRing label="Protein" value={todayTotals.protein} goal={profile.goalProtein} color={COLORS.blue} />
            <MacroRing label="Carbs"   value={todayTotals.carbs}   goal={profile.goalCarbs}   color={COLORS.orange} />
            <MacroRing label="Fat"     value={todayTotals.fat}     goal={profile.goalFat}     color={COLORS.fat} />
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.actionRow}>
          <QuickAction
            icon="add-circle-outline"
            label="Log Food"
            color={COLORS.green}
            onPress={() => navigation.navigate('FoodLog')}
          />
          <QuickAction
            icon="camera-outline"
            label="Scan Food"
            color={COLORS.blue}
            onPress={() => navigation.navigate('ImageScan')}
          />
        </View>

        {/* ── Today's Log Preview ── */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Today's Log</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FoodLog')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {todayLog.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={40} color="#ddd" />
              <Text style={styles.emptyText}>No meals logged yet today</Text>
              <Text style={styles.emptySubText}>Tap "Log Food" to get started</Text>
            </View>
          ) : (
            todayLog.slice(-3).map((entry) => (
              <View key={entry.id} style={styles.previewRow}>
                <Ionicons name="fast-food-outline" size={16} color={COLORS.green} />
                <Text style={styles.previewName} numberOfLines={1}>{entry.name}</Text>
                <Text style={styles.previewCal}>{entry.calories} kcal</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.quickAction, { borderColor: color + '44' }]} onPress={onPress}>
      <View style={[styles.qaIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={[styles.qaLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#4CAF82' },
  scroll:  { paddingBottom: 32 },
  header:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
  },
  greeting:    { fontSize: 22, fontWeight: '700', color: '#fff' },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  avatarBtn:   { padding: 4 },
  summaryCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20,
    padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20,
    padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  calorieRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  calorieMain:  { alignItems: 'center', width: 70 },
  calorieRemain:{ alignItems: 'center', width: 70 },
  calorieBar:   { flex: 1 },
  calNumber:    { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  calLabel:     { fontSize: 11, color: '#aaa' },
  barTrack:     { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 4 },
  calGoal:      { fontSize: 11, color: '#aaa', marginTop: 6, textAlign: 'center' },
  ringRow:      { flexDirection: 'row', justifyContent: 'space-around' },
  actionRow:    { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 14 },
  quickAction:  {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  qaIcon:  { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  qaLabel: { fontSize: 13, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll:     { fontSize: 13, color: '#4CAF82', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText:  { fontSize: 14, color: '#bbb', marginTop: 8, fontWeight: '600' },
  emptySubText: { fontSize: 12, color: '#ddd', marginTop: 4 },
  previewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  previewName: { flex: 1, fontSize: 14, color: '#333', marginLeft: 8 },
  previewCal:  { fontSize: 13, fontWeight: '700', color: '#888' },
});
