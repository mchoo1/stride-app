// data.js — Stride mock data (Singapore fast food, matching the source app)

const STRIDE_DATA = {
  user: { name: 'QA', streak: 1, date: 'Wed, 3 June' },

  today: {
    budget: 2149,      // TDEE baseline
    eaten: 1240,
    burned: 320,
    protein: { have: 68, goal: 130 },
    carbs:   { have: 142, goal: 210 },
    fat:     { have: 39, goal: 70 },
  },

  // value = protein grams per dollar (the hero stat)
  meals: [
    { id: 'bigmac',  name: 'Big Mac',                 brand: 'McDonald\u2019s', cat: 'Fast Food', price: 8.30, cal: 550, protein: 25, value: 3.0, halal: true,  city: 'Singapore' },
    { id: 'mcchick', name: 'McChicken',               brand: 'McDonald\u2019s', cat: 'Fast Food', price: 5.80, cal: 390, protein: 16, value: 2.8, halal: true,  city: 'Singapore' },
    { id: 'mcspicy', name: 'McSpicy',                 brand: 'McDonald\u2019s', cat: 'Fast Food', price: 8.00, cal: 500, protein: 23, value: 2.9, halal: true,  city: 'Singapore' },
    { id: 'fof',     name: 'Filet-O-Fish',            brand: 'McDonald\u2019s', cat: 'Fast Food', price: 5.80, cal: 390, protein: 15, value: 2.6, halal: true,  city: 'Singapore' },
    { id: 'eggmuff', name: 'Egg McMuffin',            brand: 'McDonald\u2019s', cat: 'Fast Food', price: 5.20, cal: 310, protein: 18, value: 3.5, halal: true,  city: 'Singapore' },
    { id: 'orig',    name: 'Original Recipe Chicken', brand: 'KFC',            cat: 'Fast Food', price: 3.80, cal: 320, protein: 21, value: 5.5, halal: true,  city: 'Singapore' },
    { id: 'zinger',  name: 'Zinger Burger',           brand: 'KFC',            cat: 'Fast Food', price: 6.90, cal: 480, protein: 27, value: 3.9, halal: true,  city: 'Singapore' },
    { id: 'whopper', name: 'Whopper',                 brand: 'Burger King',    cat: 'Fast Food', price: 9.20, cal: 660, protein: 28, value: 3.0, halal: true,  city: 'Singapore' },
    { id: 'hotcake', name: 'Hotcakes',                brand: 'McDonald\u2019s', cat: 'Fast Food', price: 4.50, cal: 490, protein: 11, value: 2.2, halal: true,  city: 'Singapore' },
  ],

  spots: [
    { id: 'mcd', name: 'McDonald\u2019s', cat: 'Fast Food', halal: true, top: 'Egg McMuffin', topVal: 3.5, dist: '0.4 km' },
    { id: 'kfc', name: 'KFC',            cat: 'Fast Food', halal: true, top: 'Original Recipe', topVal: 5.5, dist: '0.7 km' },
    { id: 'bk',  name: 'Burger King',    cat: 'Fast Food', halal: true, top: 'Whopper',        topVal: 3.0, dist: '1.1 km' },
  ],

  filters: ['Best Value', 'High Protein', 'Halal', 'Under $6', 'Vegetarian', 'Low Cal'],

  // 7-day calorie history
  history: [
    { d: 'Th', cal: 2050, goal: 2149 },
    { d: 'Fr', cal: 2380, goal: 2149 },
    { d: 'Sa', cal: 2640, goal: 2149 },
    { d: 'Su', cal: 1980, goal: 2149 },
    { d: 'Mo', cal: 2110, goal: 2149 },
    { d: 'Tu', cal: 1870, goal: 2149 },
    { d: 'Now', cal: 1240, goal: 2149 },
  ],

  loggedToday: [
    { id: 'l1', name: 'Egg McMuffin', brand: 'McDonald\u2019s', meal: 'Breakfast', cal: 310, protein: 18 },
    { id: 'l2', name: 'Original Recipe Chicken', brand: 'KFC', meal: 'Lunch', cal: 320, protein: 21 },
    { id: 'l3', name: 'Kopi-O (no sugar)', brand: 'Toast Box', meal: 'Lunch', cal: 10, protein: 0 },
  ],

  body: { weight: 75, bmr: 1709, tdee: 2149, bodyFat: null },
};

window.STRIDE_DATA = STRIDE_DATA;

// avatar initials use single brand letter
window.brandLetter = (brand) => {
  const map = { 'McDonald\u2019s': 'M', 'KFC': 'K', 'Burger King': 'B' };
  return map[brand] || brand[0];
};
