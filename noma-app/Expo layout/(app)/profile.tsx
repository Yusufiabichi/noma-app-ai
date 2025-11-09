import { StyleSheet, Text, View } from 'react-native'
import { Redirect } from 'expo-router'

const Profile = () => {

  const isLoggedIn = true;
  if(!isLoggedIn){
    return <Redirect href="/login"/>
  }
  return (
    <View style={styles.container}>
      <Text>Profile</Text>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    fontSize: 20,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  }
})