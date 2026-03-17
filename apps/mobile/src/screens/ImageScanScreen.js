import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';

// ── Simulated AI food recognition results ────────────────────────────────────
// In production, replace this with a real vision API call (e.g. Google Vision,
// Clarifai, Nutritionix AI, or a custom model).
const MOCK_RESULTS = [
  { name: 'Grilled Chicken with Vegetables', calories: 320, protein: 38, carbs: 14, fat: 9,  confidence: 0.91 },
  { name: 'Caesar Salad',                    calories: 280, protein: 8,  carbs: 18, fat: 20, confidence: 0.85 },
  { name: 'Pasta Bolognese',                  calories: 520, protein: 24, carbs: 62, fat: 18, confidence: 0.88 },
  { name: 'Avocado Toast',                    calories: 340, protein: 9,  carbs: 32, fat: 20, confidence: 0.93 },
  { name: 'Smoothie Bowl',                    calories: 410, protein: 12, carbs: 68, fat: 10, confidence: 0.87 },
  { name: 'Burger & Fries',                   calories: 880, protein: 32, carbs: 90, fat: 44, confidence: 0.90 },
];

function fakeAIRecognize() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)]);
    }, 2200);
  });
}

export default function ImageScanScreen({ navigation }) {
  const { addFoodEntry } = useApp();
  const [imageUri, setImageUri]   = useState(null);
  const [scanning, setScanning]   = useState(false);
  const [result, setResult]       = useState(null);
  const [logged, setLogged]       = useState(false);

  const pickImage = async (fromCamera) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to continue.');
      return;
    }

    const picked = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });

    if (!picked.canceled && picked.assets?.[0]?.uri) {
      setImageUri(picked.assets[0].uri);
      setResult(null);
      setLogged(false);
      runScan(picked.assets[0].uri);
    }
  };

  const runScan = async (uri) => {
    setScanning(true);
    try {
      // 🔌 Replace fakeAIRecognize() with your actual API call:
      //    const res = await fetch('https://your-api/recognize', {
      //      method: 'POST',
      //      body: JSON.stringify({ imageBase64: ... }),
      //    });
      //    const data = await res.json();
      const data = await fakeAIRecognize(uri);
      setResult(data);
    } catch {
      Alert.alert('Scan failed', 'Could not recognize the food. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleLog = () => {
    if (!result) return;
    addFoodEntry({ ...result, imageUri });
    setLogged(true);
    setTimeout(() => navigation.navigate('Home'), 800);
  };

  const reset = () => {
    setImageUri(null);
    setResult(null);
    setScanning(false);
    setLogged(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Food</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!imageUri ? (
          /* ── No image selected ── */
          <View style={styles.pickArea}>
            <View style={styles.placeholderBox}>
              <Ionicons name="camera-outline" size={64} color="#ccc" />
              <Text style={styles.placeholderTitle}>Snap or upload a photo</Text>
              <Text style={styles.placeholderText}>
                Our AI will identify the food{'\n'}and estimate the calories & macros
              </Text>
            </View>
            <View style={styles.pickButtons}>
              <TouchableOpacity style={[styles.pickBtn, { backgroundColor: '#4CAF82' }]} onPress={() => pickImage(true)}>
                <Ionicons name="camera" size={22} color="#fff" />
                <Text style={styles.pickBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickBtn, { backgroundColor: '#4A90D9' }]} onPress={() => pickImage(false)}>
                <Ionicons name="image" size={22} color="#fff" />
                <Text style={styles.pickBtnText}>From Library</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={18} color="#F5A623" />
              <Text style={styles.tipText}>
                For best results, take a clear top-down photo with the food filling most of the frame.
              </Text>
            </View>
          </View>
        ) : (
          /* ── Image selected / scanning / result ── */
          <View style={styles.resultArea}>
            <Image source={{ uri: imageUri }} style={styles.foodImage} />

            {scanning && (
              <View style={styles.scanningCard}>
                <ActivityIndicator size="large" color="#4CAF82" />
                <Text style={styles.scanningText}>Analyzing your food...</Text>
                <Text style={styles.scanningSubText}>Identifying ingredients and estimating nutrients</Text>
              </View>
            )}

            {result && !scanning && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    <View style={styles.confidenceBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF82" />
                      <Text style={styles.confidenceText}>
                        {Math.round(result.confidence * 100)}% confidence
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.resultCalories}>{result.calories}<Text style={styles.kcal}> kcal</Text></Text>
                </View>

                <View style={styles.macroGrid}>
                  <MacroBox label="Protein" value={result.protein} unit="g" color="#4A90D9" />
                  <MacroBox label="Carbs"   value={result.carbs}   unit="g" color="#F5A623" />
                  <MacroBox label="Fat"     value={result.fat}     unit="g" color="#7ED321" />
                </View>

                <Text style={styles.aiNote}>
                  * Estimates are based on typical serving sizes. Adjust as needed.
                </Text>

                {logged ? (
                  <View style={styles.loggedBadge}>
                    <Ionicons name="checkmark-circle" size={22} color="#4CAF82" />
                    <Text style={styles.loggedText}>Logged successfully!</Text>
                  </View>
                ) : (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.retryBtn} onPress={reset}>
                      <Text style={styles.retryText}>Try again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logBtn} onPress={handleLog}>
                      <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.logBtnText}>Log This Meal</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroBox({ label, value, unit, color }) {
  return (
    <View style={[styles.macroBox, { borderColor: color + '33', backgroundColor: color + '11' }]}>
      <Text style={[styles.macroValue, { color }]}>{value}{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#f8f9fb' },
  header: {
    backgroundColor: '#4A90D9', flexDirection: 'row', alignItems: 'center',
    paddingTop: 8, paddingBottom: 14, paddingHorizontal: 16,
  },
  backBtn:     { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#fff' },
  scroll:      { flexGrow: 1, paddingBottom: 40 },
  pickArea:    { flex: 1, padding: 20 },
  placeholderBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 40, alignItems: 'center',
    marginBottom: 20, borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed',
  },
  placeholderTitle: { fontSize: 18, fontWeight: '700', color: '#555', marginTop: 16 },
  placeholderText:  { fontSize: 14, color: '#aaa', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  pickButtons: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  pickBtn:     {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  pickBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  tipCard:     {
    flexDirection: 'row', backgroundColor: '#FFF8E7', borderRadius: 12,
    padding: 14, alignItems: 'flex-start', gap: 10,
  },
  tipText:     { flex: 1, fontSize: 13, color: '#8B7355', lineHeight: 20 },
  resultArea:  { padding: 16 },
  foodImage:   {
    width: '100%', height: 240, borderRadius: 20, marginBottom: 16,
    backgroundColor: '#eee',
  },
  scanningCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  scanningText:    { fontSize: 17, fontWeight: '700', color: '#333', marginTop: 14 },
  scanningSubText: { fontSize: 13, color: '#aaa', marginTop: 6, textAlign: 'center' },
  resultCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  resultHeader:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  resultName:     { fontSize: 18, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  confidenceBadge:{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  confidenceText: { fontSize: 12, color: '#4CAF82', fontWeight: '600' },
  resultCalories: { fontSize: 30, fontWeight: '800', color: '#FF6B6B' },
  kcal:           { fontSize: 14, fontWeight: '400', color: '#aaa' },
  macroGrid:      { flexDirection: 'row', gap: 10, marginBottom: 12 },
  macroBox:       {
    flex: 1, borderRadius: 12, borderWidth: 1.5, padding: 12, alignItems: 'center',
  },
  macroValue:     { fontSize: 20, fontWeight: '800' },
  macroLabel:     { fontSize: 11, color: '#888', marginTop: 2 },
  aiNote:         { fontSize: 11, color: '#bbb', textAlign: 'center', marginBottom: 16 },
  actionButtons:  { flexDirection: 'row', gap: 12 },
  retryBtn:       {
    flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#ddd', alignItems: 'center',
  },
  retryText:      { fontSize: 15, fontWeight: '600', color: '#999' },
  logBtn:         {
    flex: 2, flexDirection: 'row', paddingVertical: 13, borderRadius: 12,
    backgroundColor: '#4CAF82', alignItems: 'center', justifyContent: 'center',
  },
  logBtnText:     { fontSize: 15, fontWeight: '700', color: '#fff' },
  loggedBadge:    {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 14, gap: 8,
  },
  loggedText:     { fontSize: 16, fontWeight: '700', color: '#4CAF82' },
});
