import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function profile() {
  return (
    <View style={styles.container}>
        <Text style={styles.welcomeTitle}>Welcome to Profile Page</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#F8FFFB',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 30,
    textAlign: 'center',
  },
})