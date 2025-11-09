import React, { Component, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Select, { ISelectItem } from 'rn-custom-select-dropdown';
// import { SelectList } from 'react-native-dropdown-select-list';
import BottomTab from '../components/BottomTab'
// import MapView from 'react-native-maps'

const languages: Array<ISelectItem<string>> = [
  {
    label: "English",
    value: "English",
  },
  {
    label: "Hausa",
    value: "Hausa",
  },
]

const { width, height } = Dimensions.get('window')

const SCREEN_HEIGHT = height
const SCREEN_WIDTH = width
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.0922
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

// class MapComponent extends Component {
//   constructor(){
//     super()
//     this.state = {
//       initialPosition: {
//         latitude: 0,
//         longitute: 0,
//         latitudeDelta: 0,
//         longitudeDelta: 0,
//       },
//     }
//   }
// }

// componentDidMount();{
//   navigator.geolocation.getCurrentPosition((position) => {
//     let lat = parseFloat(position.coords.latitude)
//     let long = parseFloat(position.coords.longitude)

//     let initialRegion = {
//       latitude: lat,
//       longitute: long,
//       latitudeDelta: LATITUDE_DELTA,
//       longitudeDelta: LONGITUDE_DELTA,
//     }

//     this.setState({initialPosition: initialRegion})
//   },
//   (error) => alert(JSON.stringify(error)),
//   {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000});
// }

export default function HomeScreen({ navigation }) {
  const [selectedValue, setSelectedValue] = useState<ISelectItem<string> | null>(null);

  return (

    <SafeAreaView style={styles.container}>
      {/* Weather Card */}
      <View style={styles.weatherCard}>
        <View style={styles.weatherTop}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#fff" />
          <Text style={styles.locationText}>Kano, Nigeria</Text>
          <Text style={styles.languageText}>Lang. EN</Text>
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

      {/* <TouchableOpacity style={styles.checkButton}
      onPress={()=> navigation.navigate('Welcome')}>
        <MaterialCommunityIcons name="camera" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.checkButtonText}>Welcome screen</Text>
      </TouchableOpacity> */}

      {/* Feature Cards */}
      <View style={styles.cardRow}>
        <TouchableOpacity style={styles.card}>
          <MaterialCommunityIcons name="spray-bottle" size={30} color="#2e7d32" />
          <Text style={styles.cardText}>Fertilizer advice</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}
           onPress= {()=> navigation.navigate('/')}>
          <MaterialIcons name="pest-control" size={30} color="#c62828" />
          <Text style={styles.cardText}>Pest & Disease Guide</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <FontAwesome5 name="leaf" size={28} color="#1b5e20" />
          <Text style={styles.cardText}>Farming Tips</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <BottomTab/>
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
  languageText: {
    flex: 1,

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
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#00A300",
  },
  cardText: {
    marginTop: 10,
    marginLeft: 5,
    marginRight: 5,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    color: "#000",
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
