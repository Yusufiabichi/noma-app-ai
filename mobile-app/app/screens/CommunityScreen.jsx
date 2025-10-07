import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

export default function CommunityScreen() {
  return (
    <SafeAreaView>

    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Community Page!</Text>
      <Text style={styles.text}>Share tips, ask questions, and connect with farmers.</Text>
    </View>

    {/* Bottom nav */}
    <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}
        onPress={()=> navigation.navigate('Home')}>
          <FontAwesome5 name="seedling" size={22} color="#2e7d32" />
          <Text style={styles.navText}>Crops</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}
        onPress={()=> navigation.navigate('Community')}>
          <MaterialIcons name="forum" size={22} color="#2e7d32" />
          <Text style={styles.navText}>Community</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}
        onPress={()=> navigation.navigate('Profile')}>
          <FontAwesome5 name="user-circle" size={22} color="#2e7d32" />
          <Text style={styles.navText}>You</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fff4' },
  text: { fontSize: 18, marginVertical: 8, color: '#2f6f31', textAlign: 'center' },
   bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#f1f8e9",
  },
});
