import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {

  // const [languauge, setLanguage] = useState('eng');
  return (

    <SafeAreaView style={styles.container}>
      {/* Weather Card */}
      <View style={styles.weatherCard}>
        <View style={styles.weatherTop}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#fff" />
          <Text style={styles.locationText}>Kano, Nigeria</Text>
        </View>
        
        <View style={styles.weatherDetails}>
          <MaterialCommunityIcons name="weather-sunny" size={40} color="#fff" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.tempText}>35°C</Text>
            <Text style={styles.conditionText}>Hot & Dry</Text>
          </View>
        </View>

        <Text style={styles.sprayWarning}>⚠️ Spraying not good today</Text>
      </View>

      {/* Check My Crop Button */}
      <TouchableOpacity style={styles.checkButton}
      onPress={()=> navigation.navigate('CropCheck')}>
        <MaterialCommunityIcons name="camera" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.checkButtonText}>Check my crop</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.checkButton}
      onPress={()=> navigation.navigate('Welcome')}>
        <MaterialCommunityIcons name="camera" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.checkButtonText}>Welcome screen</Text>
      </TouchableOpacity>

      {/* Feature Cards */}
      <View style={styles.cardRow}>
        <TouchableOpacity style={styles.card}>
          <MaterialCommunityIcons name="spray-bottle" size={30} color="#2e7d32" />
          <Text style={styles.cardText}>Fertilizer advice</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}
           onPress= {()=> navigation.navigate('')}>
          <MaterialIcons name="pest-control" size={30} color="#c62828" />
          <Text style={styles.cardText}>Pest & Disease Guide</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <FontAwesome5 name="leaf" size={28} color="#1b5e20" />
          <Text style={styles.cardText}>Farming Tips</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
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
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "space-between",
  },

  // Weather Card
  weatherCard: {
    backgroundColor: "#00A300",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  weatherTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  locationText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 5,
    fontWeight: "600",
  },
  weatherDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  tempText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  conditionText: {
    color: "#c8e6c9",
    fontSize: 16,
  },
  sprayWarning: {
    color: "#ffeb3b",
    fontSize: 15,
    marginTop: 12,
    fontWeight: "600",
  },

  // Check Button
  checkButton: {
    flexDirection: "row", // ✅ to align icon + text
    backgroundColor: "#00A300",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignSelf: "center",
    marginVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  checkButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },

  // Feature Cards
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 15,
    marginTop: 10,
  },
  card: {
    backgroundColor: "#e8f5e9",
    width: 100,
    height: 120,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    color: "#2e7d32",
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#f1f8e9",
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: "#2e7d32",
    fontWeight: "600",
  },
});


    // <View style={styles.container}>
    //   <Text style={styles.title}>🌱 Welcome to NomaApp</Text>

    //   <TouchableOpacity
    //     style={styles.button}
    //     onPress={() => navigation.navigate('CropCheck')}
    //   >
    //     <Ionicons name="camera" size={20} color="white" style={{ marginRight: 8 }} />
    //     <Text style={styles.buttonText}>Check My Crop</Text>
    //   </TouchableOpacity>

    //   <TouchableOpacity
    //     style={[styles.button, { backgroundColor: '#28a745' }]}
    //     onPress={() => navigation.navigate('Profile')}
    //   >
    //     <Text style={styles.buttonText}>Go to Profile</Text>
    //   </TouchableOpacity>

    //   <TouchableOpacity
    //     style={[styles.button, { backgroundColor: '#28a745' }]}
    //     onPress={() => navigation.navigate('CheckResult')}
    //   >
    //     <Text style={styles.buttonText}>Check Result</Text>
    //   </TouchableOpacity>
    // </View>

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fff9' },
//   title: { fontSize: 22, marginBottom: 20, fontWeight: 'bold', color: '#2f6f31' },
//   button: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, marginVertical: 8 },
//   buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
// });
