import React, { useContext } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import TambahAnggotaScreen from "./screens/TambahAnggotaScreen";
import LandingScreen from "./screens/LandingScreen";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import GrupScreen from "./screens/GrupScreen";
import RiwayatScreen from "./screens/RiwayatScreen";
import ProfilScreen from "./screens/ProfilScreen";
import DetailArisanScreen from "./screens/DetailArisanScreen";
import KocokScreen from "./screens/KocokScreen";
import TambahArisanScreen from "./screens/TambahArisanScreen";
import { UserProvider, UserContext } from "./context/UserContext";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#A04030",
        tabBarInactiveTintColor: "#666",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 4,
        },
        tabBarStyle: {
          height: 65,
          backgroundColor: "#FFF",
          borderTopWidth: 1,
          borderTopColor: "#EEE",
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Beranda") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Grup") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Riwayat") {
            iconName = focused ? "time" : "time-outline";
          } else if (route.name === "Profil") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Beranda" component={HomeScreen} />
      <Tab.Screen name="Grup" component={GrupScreen} />
      <Tab.Screen name="Riwayat" component={RiwayatScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { loading, currentUser } = useContext(UserContext);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A04030" />
      </View>
    );
  }

  const isAuthenticated = !!currentUser;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated && (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
        {isAuthenticated && <Stack.Screen name="Home" component={MainTabs} />}
        <Stack.Screen name="DetailArisan" component={DetailArisanScreen} />
        <Stack.Screen name="Kocok" component={KocokScreen} />
        <Stack.Screen name="TambahArisan" component={TambahArisanScreen} />
        <Stack.Screen
          name="TambahAnggota"
          component={TambahAnggotaScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
});
