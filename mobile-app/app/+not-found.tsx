import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const notFound = () => {
  return (
    <View>
      <Text>Page not-found</Text>
      <Link href="/">Goto Home Page</Link>
    </View>
  )
}

export default notFound