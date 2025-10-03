import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CropCheckScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>📷 Take a photo of your crop to check for diseases</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fff4' },
  text: { fontSize: 18, color: '#2f6f31', textAlign: 'center', marginHorizontal: 20 },
});
