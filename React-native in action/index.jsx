import Home from './Home/Home'
import Profile from './Profile/Profile' 
import Community from './Community/Community'
import CommunityPost from './Community/CommunityPost'
import { colors } from './theme'
import { createBottomTabNavigator,
createStackNavigator } from 'react-navigation'


const options = {
    navigationOptions: {
        headerStyle: {
            backgroundColor: colors.primary
        },
        headerTintColor: '#fff'
    }
}


const CitiesNav = createStackNavigator({ 
    Home: { screen: Home },
    Community: { screen: Community },
    Profile: { screen: Profile }
}, options)

const Tabs = createBottomTabNavigator({
    Home: { screen: HomeNav },
    Community: { screen: Community },
    Profile: { screen: Profile },
})

export default Tabs
