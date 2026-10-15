import { View, Text } from 'react-native'
import React from 'react'
import RequireAccess from '@/app/components/RequireAccess';

const Weather = () => {
  return (
    <View>
      <Text>Weather</Text>
    </View>
  )
}

export default function WeatherWithAccess() {
  return (
    <RequireAccess feature="cropGuides">
      <Weather />
    </RequireAccess>
  );
}
