import React, { Component } from 'react'
import {
  View,
  StyleSheet,
  StatusBar,
  Linking,
  Alert,
  Platform,
  AppState,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Video from 'react-native-video'
import Colors from '../common/Colors'

import { initializeDB } from '../store/actions/storage'
import BottomSheet from 'reanimated-bottom-sheet'
import DeviceInfo from 'react-native-device-info'
import ErrorModalContents from '../components/ErrorModalContents'
import ModalHeader from '../components/ModalHeader'
import {
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import { connect } from 'react-redux'
import idx from 'idx'
import { processDL } from '../common/CommonFunctions'

type LaunchScreenProps = {
  initializeDB: any;
  navigation: any;
  lastSeen: any;
  databaseInitialized: Boolean;
}

type LaunchScreenState = { }

class Launch extends Component<LaunchScreenProps, LaunchScreenState> {
  errorBottomSheet: any;
  url: any;
  constructor( props ) {
    super( props )
    this.errorBottomSheet = React.createRef()
    // console.log( ':LAUNCH' )
  }

  componentDidMount = async() => {
    AppState.addEventListener( 'change', this.handleAppStateChange )
    Linking.addEventListener( 'url', this.handleDeepLinkEvent )
    Linking.getInitialURL().then( ( url )=> this.handleDeepLinkEvent( {
      url
    } ) )
    setTimeout( ()=>{
      this.postSplashScreenActions()
    }, 4000 )
  };

   handleDeepLinkEvent = async ( { url } ) => {
     this.handleDeepLinking( url )
   }

   handleDeepLinking = async ( url: string | null ) => {
     //console.log( 'Launch::handleDeepLinkEvent::URL: ', url )
     if ( url == null ) {
       return
     }
     this.url=url
   }


  componentWillUnmount = () => {
    AppState.removeEventListener( 'change', this.handleAppStateChange )
    Linking.removeEventListener( 'url', this.handleDeepLinkEvent )
  };


  handleAppStateChange = async ( nextAppState ) => {
    // no need to trigger login screen if accounts are not synced yet
    // which means user hasn't logged in yet
    const walletExists = await AsyncStorage.getItem( 'walletExists' )
    //const lastSeen = await AsyncStorage.getItem( 'lastSeen' )
    if ( !walletExists ) {
      return
    }
  };

  postSplashScreenActions = async () => {
    try {
      const url = await Linking.getInitialURL()
      //console.log( 'url', url )

      const hasCreds = await AsyncStorage.getItem( 'hasCreds' )

      // initiates the SQL DB
      if( !this.props.databaseInitialized ) this.props.initializeDB()

      // scenario based navigation
      if ( hasCreds ) {
        const now: any = new Date()
        const diff = Math.abs( now - this.props.lastSeen )
        const isHomePageOpen = Number( diff ) < Number( 20000 )
        console.log( 'diff', diff, isHomePageOpen )
        if( isHomePageOpen ){
          if ( !this.url ){
            this.props.navigation.replace( 'Home', {
              screen: 'Home',
            } )
          } else {
            const requestName = await processDL( this.url )
            this.props.navigation.replace( 'Home', {
              screen: 'Home',
              params: {
                custodyRequest: requestName && requestName.custodyRequest ? requestName.custodyRequest : null,
                recoveryRequest: requestName && requestName.recoveryRequest ? requestName.recoveryRequest : null,
                trustedContactRequest: requestName && requestName.trustedContactRequest ? requestName.trustedContactRequest : null,
                userKey: requestName && requestName.userKey ? requestName.userKey : null,
                swanRequest: requestName && requestName.swanRequest ? requestName.swanRequest : null,
              }
            } )
          }
        } else if ( !this.url ){
          this.props.navigation.replace( 'Login' )
        } else {
          const requestName = await processDL( this.url )
          this.props.navigation.replace( 'Login', {
            custodyRequest: requestName && requestName.custodyRequest ? requestName.custodyRequest : null,
            recoveryRequest: requestName && requestName.recoveryRequest ? requestName.recoveryRequest : null,
            trustedContactRequest: requestName && requestName.trustedContactRequest ? requestName.trustedContactRequest : null,
            userKey: requestName && requestName.userKey ? requestName.userKey : null,
            swanRequest: requestName && requestName.swanRequest ? requestName.swanRequest : null,
          } )
        }

      } else {
        this.props.navigation.replace( 'PasscodeConfirm' )
      }

    } catch ( err ) {
      console.log( 'err', err );
      ( this.errorBottomSheet as any ).current.snapTo( 1 )
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <Video
          source={require( './../assets/video/splash_animation.mp4' )}
          style={{
            flex: 1,
          }}
          muted={true}
          repeat={false}
          resizeMode={'cover'}
          rate={1.0}
          ignoreSilentSwitch={'obey'}

        />
        <StatusBar
          backgroundColor={'white'}
          hidden={true}
          barStyle="dark-content"
        />
        <BottomSheet
          enabledInnerScrolling={true}
          ref={this.errorBottomSheet as any}
          snapPoints={[
            -50,
            Platform.OS == 'ios' && DeviceInfo.hasNotch()
              ? hp( '35%' )
              : hp( '40%' ),
          ]}
          renderContent={() => (
            <ErrorModalContents
              title={'Login error'}
              info={'Error while loging in, please try again'}
              proceedButtonText={'Open Setting'}
              isIgnoreButton={true}
              onPressProceed={() => {
                ( this.errorBottomSheet as any ).current.snapTo( 0 )
              }}
              onPressIgnore={() => {
                ( this.errorBottomSheet as any ).current.snapTo( 0 )
              }}
              isBottomImage={true}
              bottomImage={require( '../assets/images/icons/errorImage.png' )}
            />
          )}
          renderHeader={() => (
            <ModalHeader
              onPressHeader={() => {
                ( this.errorBottomSheet as any ).current.snapTo( 0 )
              }}
            />
          )}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
} )



const mapStateToProps = ( state ) => {
  return {
    databaseInitialized: idx( state, ( _ ) => _.storage.databaseInitialized ),
    lastSeen: idx( state, ( _ ) => _.preferences.lastSeen )

  }
}

export default connect( mapStateToProps, {
  initializeDB
} )( Launch )
