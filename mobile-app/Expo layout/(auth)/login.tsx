import { StyleSheet, Text, View, Button } from 'react-native'
import { Link, router } from 'expo-router'
export default function login() {
  return (
    <View style={styles.container}>
      <Text>login</Text>
      <Link href="./register">Create account</Link>
      <Button title='Login' onPress={()=> router.replace("/profile")}/>
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