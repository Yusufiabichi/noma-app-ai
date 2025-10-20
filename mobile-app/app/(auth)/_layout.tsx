import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import { Slot } from 'expo-router'

export default function Authlayout() {
  return (
    <View style={styles.container}>
      <Text>Welcome to NomaApp</Text>
      <Image style={styles.logo} 
      source={require("../../assets/nomaapp.png")} 
       />
      <Slot />
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        // width: 100,
        height: 100,
    },
})