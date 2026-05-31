import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen     from '../screens/HomeScreen';
import FoodLogScreen  from '../screens/FoodLogScreen';
import ImageScanScreen from '../screens/ImageScanScreen';
import ProfileScreen  from '../screens/ProfileScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home"       component={HomeScreen} />
        <Stack.Screen name="FoodLog"    component={FoodLogScreen} />
        <Stack.Screen name="ImageScan"  component={ImageScanScreen} />
        <Stack.Screen name="Profile"    component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
