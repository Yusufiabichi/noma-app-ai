import { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const WelcomeScreen = () => {
    const [lang, setLang] = useState('eng');

  return (
    <SafeAreaView>
      {lang=== 'hau' && <Text style={styles.welcomeMessage}>Barka da Zuwa NomaApp</Text>}
      {lang=== 'eng' && <Text style={styles.welcomeMessage}>Welcome to NomaApp</Text>}
      <TouchableOpacity style={styles.checkButton}
      onPress={()=> setLang('eng')}>
        <Text style={styles.checkButtonText}>English</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.checkButton}
      onPress={()=> setLang('hau')}>
        <Text style={styles.checkButtonText}>Hausa</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

export default WelcomeScreen;

const styles = StyleSheet.create({
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
  welcomeMessage: {
    textAlign: "center",
    alignContent: "center",
    fontSize: 35,
  }
});