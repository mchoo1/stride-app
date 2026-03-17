# FitnessApp 🥗

A React Native (Expo) mobile app to track calories, log meals, and scan food photos for automatic nutrition estimation.

---

## Features

| Feature | Description |
|---|---|
| **Dashboard** | Daily calorie ring, macro breakdown (protein / carbs / fat), today's log preview |
| **Food Log** | Manual entry with name + macros, quick-add from a common foods database, delete entries |
| **Image Scan** | Take or upload a food photo → AI identifies the dish and estimates calories & macros (mock AI, ready for real API plug-in) |
| **Profile & Goals** | Set your name, fitness goal (lose / gain / maintain), and daily calorie + macro targets |

---

## Getting Started

### 1. Install dependencies

```bash
cd FitnessApp
npm install
```

### 2. Start the development server

```bash
npx expo start
```

Then:
- Scan the QR code with **Expo Go** (iOS / Android)
- Press **`i`** for iOS Simulator or **`a`** for Android Emulator

---

## Connecting a Real AI for Food Recognition

Open `src/screens/ImageScanScreen.js` and replace `fakeAIRecognize()` with a real API call. Good options:

| Service | Notes |
|---|---|
| **Nutritionix Track API** | Purpose-built food recognition + nutrition |
| **Google Cloud Vision + Custom Model** | Flexible, requires labelling pipeline |
| **Clarifai Food Model** | Pre-trained food detection |
| **LogMeal API** | Dedicated food AI with nutrition data |

The response shape expected by the app:
```json
{
  "name": "Grilled Chicken",
  "calories": 320,
  "protein": 38,
  "carbs": 14,
  "fat": 9,
  "confidence": 0.91
}
```

---

## Project Structure

```
FitnessApp/
├── App.js                          # Root component
├── app.json                        # Expo config
├── src/
│   ├── context/
│   │   └── AppContext.js           # Global state (food log, profile, totals)
│   ├── navigation/
│   │   └── AppNavigator.js         # Stack navigator
│   ├── screens/
│   │   ├── HomeScreen.js           # Dashboard
│   │   ├── FoodLogScreen.js        # Log + quick-add
│   │   ├── ImageScanScreen.js      # AI food scan
│   │   └── ProfileScreen.js        # Goals & targets
│   └── components/
│       ├── MacroRing.js            # Circular macro progress widget
│       └── FoodEntryCard.js        # Single food log card
```

---

## Roadmap (future features)

- [ ] Community Macro Database — crowdsourced restaurant & grocery macros
- [ ] Smart Food Recommendations — suggest restaurants / items based on health goal
- [ ] Fitness tracker integration (Apple Health, Google Fit, Fitbit)
- [ ] Weekly / monthly nutrition history charts
- [ ] Barcode scanner for packaged foods
- [ ] Persistent storage (AsyncStorage / Supabase)
