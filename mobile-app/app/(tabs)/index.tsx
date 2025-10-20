// app/index.js
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";


export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Location Card */}
      <View style={styles.locationCard}>
        <View>
          <Text style={styles.locationLabel}>Current Location</Text>
          <Text style={styles.locationName}>Kano, Nigeria</Text>
          <Text style={styles.temperature}>🌡️ 32°C</Text>
          <View style={styles.statusBox}>
            <Feather name="check-square" size={16} color="#00B894" />
            <Text style={styles.statusText}>Spray Favorable</Text>
          </View>
        </View>
        <View style={styles.sunIcon}>
          <Feather name="sun" size={28} color="#fff" />
        </View>
      </View>

      {/* Welcome Message */}
      <Text style={styles.welcomeTitle}>Welcome, Farmer!</Text>
      <Text style={styles.subtitle}>Diagnose your crops with AI</Text>

      {/* Scan Button */}
      <TouchableOpacity style={styles.scanButton}>
        <FontAwesome name="camera" size={20} color="#fff" />
        <Text style={styles.scanText}>Scan Your Crop</Text>
      </TouchableOpacity>

      {/* Quick Options */}
      <View style={styles.cardRow}>
        <TouchableOpacity style={styles.card}>
          <MaterialCommunityIcons name="spray-bottle" size={30} color="#00B894" />
          <Text style={styles.cardText}>Fertilizer Advice</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <MaterialIcons name="pest-control" size={30} color="#c62828" />
          <Text style={styles.cardText}>Pest & Disease Guide</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <FontAwesome5 name="leaf" size={28} color="#00B894" />
          <Text style={styles.cardText}>Farming Tips</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFB',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  locationCard: {
    backgroundColor: '#00B894',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLabel: {
    color: '#E0FFEF',
    fontSize: 14,
  },
  locationName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginVertical: 4,
  },
  temperature: {
    color: '#fff',
    fontSize: 16,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FFF2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 5,
  },
  statusText: {
    color: '#00B894',
    marginLeft: 5,
    fontSize: 12,
  },
  sunIcon: {
    backgroundColor: '#00A982',
    padding: 12,
    borderRadius: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 30,
    textAlign: 'center',
  },
  subtitle: {
    color: '#5C5C5C',
    textAlign: 'center',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#00B894',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '30%',
    alignItems: 'center',
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#00B894",
  },
  cardText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    color: '#2C2C2C',
    paddingHorizontal: 6,
  },
});
