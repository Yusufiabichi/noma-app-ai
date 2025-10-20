import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const community = () => {
  return (
    <View style={styles.container}>
      <Text>community</Text>
    </View>
  )
}

export default community

const styles = StyleSheet.create({
  container: {
    fontSize: 20,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  }
})