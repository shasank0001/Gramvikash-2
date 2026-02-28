import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { navigationRef, navigate, RootTabParamList } from './navigationRef';

import FeedScreen from '../screens/FeedScreen';
import MandiScreen from '../screens/MandiScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import AICoPilotScreen from '../screens/AICoPilotScreen';
import SchemesScreen from '../screens/SchemesScreen';
import SOSScreen from '../screens/SOSScreen';
import ProfileScreen from '../screens/ProfileScreen';

export { navigationRef, navigate, RootTabParamList };

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Feed: 'home',
  Mandi: 'storefront',
  Resources: 'handshake',
  AICoPilot: 'smart-toy',
  Schemes: 'account-balance',
  SOS: 'emergency',
  Profile: 'person',
};

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof MaterialIcons.glyphMap;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <MaterialIcons name={name} size={24} color={color} />
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={TAB_ICONS[route.name] ?? 'home'}
              color={color}
              focused={focused}
            />
          ),
        })}
      >
        <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Village' }} />
        <Tab.Screen name="Mandi" component={MandiScreen} options={{ title: 'Mandi' }} />
        <Tab.Screen name="Resources" component={ResourcesScreen} options={{ title: 'Share' }} />
        <Tab.Screen name="AICoPilot" component={AICoPilotScreen} options={{ title: 'AI Help' }} />
        <Tab.Screen name="Schemes" component={SchemesScreen} options={{ title: 'Schemes' }} />
        <Tab.Screen
          name="SOS"
          component={SOSScreen}
          options={{
            title: 'SOS',
            tabBarActiveTintColor: COLORS.danger,
            tabBarInactiveTintColor: COLORS.danger,
          }}
        />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Me' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 60,
    paddingBottom: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconFocused: {
    backgroundColor: COLORS.primaryLight + '22',
  },
});
