import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import React, { Component } from 'react'
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";


export default class BottomTab extends Component {
  render() {
    return (
        <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem}
            onPress={()=> navigation.navigate('Home')}>
            <FontAwesome5 name="seedling" size={22} color="#2e7d32" />
            <Text style={styles.navText}>Crops</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}
            onPress={()=> navigation.navigate('Community')}>
            <MaterialIcons name="forum" size={22} color="#2e7d32" />
            <Text style={styles.navText}>Community</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}
            onPress={()=> navigation.navigate('Profile')}>
            <FontAwesome5 name="user-circle" size={22} color="#2e7d32" />
            <Text style={styles.navText}>You</Text>
            </TouchableOpacity>
        </View>
    )
  }
}


const styles = StyleSheet.create({
   bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#f1f8e9",
  },
});
