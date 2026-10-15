import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import { Slot, Stack } from 'expo-router'
import RequireAccess from '@/app/components/RequireAccess';

function Authlayout() {
  return (
    <Stack>
        <Stack.Screen name="index" options={{headerShown: false}} />
      <Slot />
    </Stack>
  )
}

export default function AuthlayoutWithAccess() {
  return (
    <RequireAccess feature="cropScan">
      <Authlayout />
    </RequireAccess>
  );
}
