import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function forgetPassword() {
  return (
    <View style={styles.container}>
      <Text>forget Password</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
})