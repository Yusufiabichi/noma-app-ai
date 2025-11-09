import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const MarketPlace = () => {
  return (
    <View style={styles.container}>
      <Text>MarketPlace</Text>
    </View>
  )
}

export default MarketPlace

const styles = StyleSheet.create({
  container: {
    fontSize: 20,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  }
})