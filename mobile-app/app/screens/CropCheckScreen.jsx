import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

export default function CropCheckScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Take a photo of your crop to check for diseases</Text>
      <TouchableOpacity style={styles.checkButton}
      onPress={()=> navigation.navigate('CheckResult')}>
        <MaterialCommunityIcons name="camera" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.checkButtonText}>Check my crop</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fff4' },
  text: { fontSize: 18, color: '#2f6f31', textAlign: 'center', marginHorizontal: 20 },
});
