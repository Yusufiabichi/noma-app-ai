import { View } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'

const index = () => {
  const router = useRouter()

  return (
    <View>
      {router.push('/(tabs)')}
    </View>
  )
}

export default index