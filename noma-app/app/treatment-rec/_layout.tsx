import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import { Slot, Stack } from 'expo-router'

export default function Authlayout() {
  return (
    <Stack>
        <Stack.Screen name="index" options={{headerShown: false}} />
      <Slot />
    </Stack>
  )
}

