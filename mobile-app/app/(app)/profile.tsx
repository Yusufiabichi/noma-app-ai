import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const profile = () => {
  return (
    <View style={styles.container}>
      <Text>profile</Text>
    </View>
  )
}

export default profile

const styles = StyleSheet.create({
  container: {
    fontSize: 20,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  }
})