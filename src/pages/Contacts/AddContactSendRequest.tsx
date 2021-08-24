import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  ScrollView
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import CommonStyles from '../../common/Styles/Styles'
import Colors from '../../common/Colors'
import Fonts from '../../common/Fonts'
import { RFValue } from 'react-native-responsive-fontsize'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import NavStyles from '../../common/Styles/NavStyles'
import BottomSheet from 'reanimated-bottom-sheet'
import DeviceInfo from 'react-native-device-info'
import SendViaLink from '../../components/SendViaLink'
import { generateDeepLink, isEmpty } from '../../common/CommonFunctions'
import SendViaQR from '../../components/SendViaQR'
import config from '../../bitcoin/HexaConfig'
import ModalHeader from '../../components/ModalHeader'
import TimerModalContents from './TimerModalContents'
import RequestKeyFromContact from '../../components/RequestKeyFromContact'
import ShareOtpWithContact from '../NewBHR/ShareOtpWithTrustedContact'
import { DeepLinkEncryptionType, QRCodeTypes, TrustedContact, Trusted_Contacts, Wallet } from '../../bitcoin/utilities/Interface'
import { initializeTrustedContact, InitTrustedContactFlowKind, PermanentChannelsSyncKind, syncPermanentChannels, updateTrustedContacts } from '../../store/actions/trustedContacts'
import useTrustedContacts from '../../utils/hooks/state-selectors/trusted-contacts/UseTrustedContacts'
import idx from 'idx'
import Toast from '../../components/Toast'
import TrustedContactsOperations from '../../bitcoin/utilities/TrustedContactsOperations'
import ModalContainer from '../../components/home/ModalContainer'
import BottomInfoBox from '../../components/BottomInfoBox'
import Secure2FA from './Secure2FAModal'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ExpoContacts from 'expo-contacts'

export default function AddContactSendRequest( props ) {
  const [ isOTPType, setIsOTPType ] = useState( false )
  const [ shareOtpWithTrustedContactModel, setShareOtpWithTrustedContactModel ] = useState( false )
  const [ OTP, setOTP ] = useState( '' )
  const [ secure2FAModal, setSecure2FAModal ] = useState( false )
  const [ SendViaLinkBottomSheet ] = useState(
    React.createRef(),
  )
  const [ SendViaQRBottomSheet ] = useState(
    React.createRef(),
  )
  const [ ContactRequestBottomSheet ] = useState(
    React.createRef(),
  )
  const [ timerModal, setTimerModal ] = useState( false )
  const [ renderTimer, setRenderTimer ] = useState( false )

  const [ trustedLink, setTrustedLink ] = useState( '' )
  const [ trustedQR, setTrustedQR ] = useState( '' )
  const [ selectedContactsCHKey, setSelectedContactsCHKey ] = useState( '' )
  const [ encryptLinkWith, setEncryptLinkWith ] = useState( DeepLinkEncryptionType.DEFAULT )

  const SelectedContact = props.navigation.getParam( 'SelectedContact' )
    ? props.navigation.getParam( 'SelectedContact' )
    : []

  const headerText = props.navigation.getParam( 'headerText' )
    ? props.navigation.getParam( 'headerText' )
    : ''

  const subHeaderText = props.navigation.getParam( 'subHeaderText' )
    ? props.navigation.getParam( 'subHeaderText' )
    : ''

  const contactText = props.navigation.getParam( 'contactText' )
    ? props.navigation.getParam( 'contactText' )
    : ''

  const showDone = props.navigation.getParam( 'showDone' )
    ? props.navigation.getParam( 'showDone' )
    : false

  const isKeeper = props.navigation.getParam( 'isKeeper' )
    ? props.navigation.getParam( 'isKeeper' )
    : false

  const isPrimary = props.navigation.getParam( 'isPrimary' )
    ? props.navigation.getParam( 'isPrimary' )
    : false

  const existingContact = props.navigation.getParam( 'existingContact' )
    ? props.navigation.getParam( 'existingContact' )
    : false

  const [ Contact ] = useState(
    SelectedContact ? SelectedContact[ 0 ] : {
    },
  )
  const [ contactInfo, setContact ] = useState( SelectedContact ? SelectedContact[ 0 ] : {
  } )

  const wallet: Wallet = useSelector(
    ( state ) => state.storage.wallet,
  )
  const trustedContacts: Trusted_Contacts = useTrustedContacts()
  const dispatch = useDispatch()

  const getContact = () => {
    ExpoContacts.getContactsAsync().then( async ( { data } ) => {
      const filteredData = data.find( item => item.id === contactInfo.id )
      // setPhoneumber( filteredData.phoneNumbers )

      setContact( filteredData )
      // setEmails( filteredData.emails )
      // await AsyncStorage.setItem( 'ContactData', JSON.stringify( data ) )
    } )
  }
  const createTrustedContact = useCallback( async () => {
    const contacts: Trusted_Contacts = trustedContacts

    for( const contact of Object.values( contacts ) ){
      if ( contact.contactDetails.id === Contact.id ) return
    }
    // if ( fromEdit ) {
    //   dispatch( editTrustedContact( {
    //     channelKey: Contact.channelKey,
    //     contactName: Contact.name,
    //     image: Contact.image
    //   } ) )
    // } else {
    dispatch( initializeTrustedContact( {
      contact: Contact,
      flowKind: InitTrustedContactFlowKind.SETUP_TRUSTED_CONTACT
    } ) )
    // }

  }, [ Contact ] )

  useEffect( () => {
    getContact()
  }, [] )

  useEffect( ()=> {
    if ( !Contact ) return
    createTrustedContact()
    if( trustedLink || trustedQR ){
      setTrustedLink( '' )
      setTrustedQR( '' )
    }
  }, [ Contact ] )

  useEffect( () => {
    console.log( 'useEffect Contact', Contact )
    // capture the contact
    if( !Contact ) return
    console.log( 'Contact', Contact )
    const contacts: Trusted_Contacts = trustedContacts
    let currentContact: TrustedContact
    let channelKey: string

    if( contacts )
      for( const ck of Object.keys( contacts ) ){
        if ( contacts[ ck ].contactDetails.id === Contact.id ){
          currentContact = contacts[ ck ]
          channelKey = ck
          setSelectedContactsCHKey( channelKey )
          break
        }
      }
    if ( !currentContact ) return

    // generate deep link & QR for the contact
    let encryption_key: string
    if( currentContact.deepLinkConfig ){
      const { encryptionType, encryptionKey } = currentContact.deepLinkConfig
      if( encryptLinkWith === encryptionType ) encryption_key = encryptionKey
    }

    if( !encryption_key )
      switch( encryptLinkWith ){
          case DeepLinkEncryptionType.NUMBER:
            const phoneNumber = idx( contactInfo, ( _ ) => _.phoneNumbers[ 0 ].number )

            if( phoneNumber ){
              const number = phoneNumber.replace( /[^0-9]/g, '' ) // removing non-numeric characters
              encryption_key = number.slice( number.length - 10 ) // last 10 digits only
            } else { Toast( 'F&F contact number missing' ); return }
            break

          case DeepLinkEncryptionType.EMAIL:
            const email = idx( contactInfo, ( _ ) => _.emails[ 0 ].email )
            if( email ){
              encryption_key = email // last 10 digits only
            } else { Toast( 'F&F contact email missing' ); return }
            break

          case DeepLinkEncryptionType.OTP:
            // openTimer()
            encryption_key = TrustedContactsOperations.generateKey( 6 )
            setOTP( encryption_key )
            setIsOTPType( true )
            // setShareOtpWithTrustedContactModel( true )
            // setEncryptLinkWith( DeepLinkEncryptionType.DEFAULT )
            break
      }

    const { deepLink, encryptedChannelKeys, encryptionType, encryptionHint } = generateDeepLink( encryptLinkWith, encryption_key, currentContact, wallet.walletName )
    setTrustedLink( deepLink )
    const appVersion = DeviceInfo.getVersion()
    setTrustedQR(
      JSON.stringify( {
        type: existingContact ? QRCodeTypes.EXISTING_CONTACT : isPrimary ? QRCodeTypes.PRIMARY_KEEPER_REQUEST : isKeeper ? QRCodeTypes.KEEPER_REQUEST : QRCodeTypes.CONTACT_REQUEST,
        encryptedChannelKeys: encryptedChannelKeys,
        encryptionType,
        encryptionHint,
        walletName: wallet.walletName,
        version: appVersion,
      } )
    )

    // update deeplink configuration for the contact
    if( !currentContact.deepLinkConfig || currentContact.deepLinkConfig.encryptionType !== encryptLinkWith )
      dispatch( updateTrustedContacts( {
        [ currentContact.channelKey ]: {
          ...currentContact,
          deepLinkConfig: {
            encryptionType: encryptLinkWith,
            encryptionKey: encryption_key,
          }
        }
      } ) )

  }, [ Contact, trustedContacts, encryptLinkWith ] )

  const openTimer = async () => {
    setTimeout( () => {
      setRenderTimer( true )
    }, 2 )
    // const TCRequestTimer = JSON.parse(
    //   await AsyncStorage.getItem( 'TCRequestTimer' ),
    // );
    // ( SendViaLinkBottomSheet as any ).current.snapTo( 0 )
    // if ( !TCRequestTimer ) {
    //   ( TimerModalBottomSheet as any ).current.snapTo( 1 )
    // }
  }

  const renderSendViaLinkContents = useCallback( () => {
    if ( !isEmpty( Contact ) ) {
      return (
        <SendViaLink
          isFromReceive={true}
          headerText={'Share'}
          subHeaderText={'Send to your contact'}
          contactText={contactText}
          contact={Contact ? Contact : null}
          infoText={`Click here to accept contact request from ${
            wallet.walletName
          }' Hexa wallet - link will expire in ${
            config.TC_REQUEST_EXPIRY / ( 60000 * 60 )
          } hours`}
          link={trustedLink}
          contactEmail={''}
          onPressBack={() => {
            if ( SendViaLinkBottomSheet.current )
              ( SendViaLinkBottomSheet as any ).current.snapTo( 0 )
          }}
          onPressDone={async () => {
            setTimeout( () => {
              setRenderTimer( true )
            }, 2 )
            if ( isOTPType ) {
              setShareOtpWithTrustedContactModel( true )
            } else {
              // openTimer()
            }
            ( SendViaLinkBottomSheet as any ).current.snapTo( 0 )
          }}
        />
      )
    }
  }, [ Contact, trustedLink ] )



  const renderSendViaQRContents = useCallback( () => {
    return (
      <SendViaQR
        isFromReceive={true}
        headerText={'Friends and Family Request'}
        subHeaderText={'Scan the QR from your Contact\'s Hexa Wallet'}
        contactText={contactText}
        contact={Contact}
        QR={trustedQR}
        contactEmail={''}
        onPressBack={() => {
          if ( SendViaQRBottomSheet.current )
            ( SendViaQRBottomSheet as any ).current.snapTo( 0 )
        }}
        onPressDone={() => {
          ( SendViaQRBottomSheet as any ).current.snapTo( 0 )
          // openTimer()
        }}
      />
    )
  }, [ Contact, trustedQR ] )

  const renderTimerModalContents = useCallback( () => {
    return (
      <TimerModalContents
        isOTPType={isOTPType}
        contactText={'Trusted Contact'}
        contact={Contact}

        renderTimer={renderTimer}
        onPressContinue={() => onContinueWithTimer()}
      />
    )
  }, [ renderTimer ] )


  const onContinueWithTimer = () => {
    setTimerModal( false )
    props.navigation.goBack()
  }


  const renderShareOtpWithTrustedContactContent = useCallback( () => {
    return (
      <ShareOtpWithContact
        renderTimer={renderTimer}
        onPressOk={() => {
          setRenderTimer( false )
          setShareOtpWithTrustedContactModel( false )
          props.navigation.popToTop()
        }}
        onPressBack={() => {
          setShareOtpWithTrustedContactModel( false )
        }}
        OTP={OTP}
      />
    )
  }, [ OTP, renderTimer ] )

  console.log( 'trustedQR', trustedQR )

  return (
    <SafeAreaView style={{
      flex: 1, backgroundColor: Colors.backgroundColor
    }}>
      <StatusBar backgroundColor={Colors.backgroundColor} barStyle="dark-content" />
      <ScrollView >
        <View style={[ CommonStyles.headerContainer, {
          backgroundColor: Colors.backgroundColor
        } ]}>
          <TouchableOpacity
            style={CommonStyles.headerLeftIconContainer}
            onPress={() => {
              props.navigation.popToTop()
            }}
          >
            <View style={CommonStyles.headerLeftIconInnerContainer}>
              <FontAwesome
                name="long-arrow-left"
                color={Colors.blue}
                size={17}
              />
            </View>
          </TouchableOpacity>
        </View>
        <RequestKeyFromContact
          isModal={false}
          // headerText={'Request Recovery Secret from trusted contact'}
          // subHeaderText={`Request share from trusted Contact, you can change${'\n'}your trusted contact, or either primary mode of context`}
          contactText={'Adding to Friends and Family:'}
          contact={Contact}
          QR={trustedQR}
          link={trustedLink}
          contactEmail={''}
          onPressBack={() => {
            props.navigation.goBack()
          }}
          onPressDone={() => {
            // openTimer()
          }}
          onPressShare={() => {
            setTimeout( () => {
              setRenderTimer( true )
            }, 2 )
            if ( isOTPType ) {
              setShareOtpWithTrustedContactModel( true )
            } else {
              openTimer()
            }
          }}
        />
        <TouchableOpacity
          onPress={() => setSecure2FAModal( true )}
          style={{
            flex: 1
          }}>
          <BottomInfoBox
            icon={true}
            title={'Secure with 2FA'}
            infoText={
              '2 Factor Authentication gives you an additional layer of security and implementing it is highly recommended.'
            }
            backgroundColor={Colors.white}
          />
        </TouchableOpacity>
        {/* <View style={{
          marginTop: 'auto'
        }}>
          <View style={{
            marginBottom: hp( '1%' )
          }}>
            <BottomInfoBox
              title={'Friends and Family request'}
              infoText={
                'Your contact will have to accept your request for you to add them'
              }
            />
          </View> */}
        {/* <View
            style={{
              flexDirection: 'row',
              backgroundColor: Colors.blue,
              height: 60,
              borderRadius: 10,
              marginLeft: 25,
              marginRight: 25,
              marginBottom: hp( '4%' ),
              justifyContent: 'space-evenly',
              alignItems: 'center',
              shadowColor: Colors.shadowBlue,
              shadowOpacity: 1,
              shadowOffset: {
                width: 15, height: 15
              },
            }}
          >
            <TouchableOpacity
              onPress={() => {
                createTrustedContact()
                if ( SendViaLinkBottomSheet.current )
                  ( SendViaLinkBottomSheet as any ).current.snapTo( 1 )
              }}
              style={styles.buttonInnerView}
            >
              <Image
                source={require( '../../assets/images/icons/openlink.png' )}
                style={styles.buttonImage}
              />
              <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>
            <View
              style={{
                width: 1, height: 30, backgroundColor: Colors.white
              }}
            />
            <TouchableOpacity
              style={styles.buttonInnerView}
              onPress={() => {
                createTrustedContact()
                if ( SendViaQRBottomSheet.current )
                  ( SendViaQRBottomSheet as any ).current.snapTo( 1 )
              }}
            >
              <Image
                source={require( '../../assets/images/icons/qr-code.png' )}
                style={styles.buttonImage}
              />
              <Text style={styles.buttonText}>QR</Text>
            </TouchableOpacity>
          </View> */}
        {/* </View> */}
        {/* <BottomSheet
          enabledGestureInteraction={false}
          enabledInnerScrolling={true}
          ref={SendViaLinkBottomSheet as any}
          snapPoints={[
            -50,
            Platform.OS == 'ios' && DeviceInfo.hasNotch()
              ? hp( '45%' )
              : hp( '46%' ),
          ]}
          renderContent={renderSendViaLinkContents}
          renderHeader={renderSendViaLinkHeader}
        />
        <BottomSheet
          enabledGestureInteraction={false}
          enabledInnerScrolling={true}
          ref={SendViaQRBottomSheet as any}
          snapPoints={[
            -50,
            Platform.OS == 'ios' && DeviceInfo.hasNotch()
              ? hp( '46%' )
              : hp( '46%' ),
          ]}
          renderContent={renderSendViaQRContents}
          renderHeader={renderSendViaQRHeader}
        /> */}
        {/* <BottomSheet
          enabledGestureInteraction={false}
          enabledInnerScrolling={true}
          ref={ContactRequestBottomSheet as any}
          snapPoints={[
            -50,
            Platform.OS == 'ios' && DeviceInfo.hasNotch()
              ? hp( '86%' )
              : hp( '86%' ),
          ]}
          renderContent={renderContactRequest}
          renderHeader={renderContactRequestHeader}
        /> */}
        <ModalContainer visible={secure2FAModal} closeBottomSheet={() => {}} >
          <Secure2FA
            closeBottomSheet={()=> setSecure2FAModal( false )}
            onConfirm={( type ) => {
              if( type === DeepLinkEncryptionType.OTP ) {
                setIsOTPType( true )
              }
              setEncryptLinkWith( type ); setSecure2FAModal( false )
            }}
            Contact={contactInfo}
          />
        </ModalContainer>
        <ModalContainer visible={timerModal }  closeBottomSheet={() => {}} >
          {renderTimerModalContents()}
        </ModalContainer>
        <ModalContainer visible={shareOtpWithTrustedContactModel }  closeBottomSheet={() => {}} >
          {renderShareOtpWithTrustedContactContent()}
        </ModalContainer>
      </ScrollView>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create( {
  contactProfileView: {
    flexDirection: 'row',
    marginLeft: 20,
    marginRight: 20,
    alignItems: 'center',
    marginTop: hp( '1.7%' ),
  },
  contactProfileImage: {
    borderRadius: 60 / 2,
    width: 60,
    height: 60,
    resizeMode: 'cover',
    shadowColor: Colors.shadowBlue,
    shadowOpacity: 1,
    shadowOffset: {
      width: 15, height: 15
    },
  },
  contactNameText: {
    color: Colors.textColorGrey,
    fontSize: RFValue( 20 ),
    fontFamily: Fonts.FiraSansRegular,
    marginLeft: 25,
  },
  buttonInnerView: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: wp( '30%' ),
  },
  buttonImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: Colors.white,
  },
  buttonText: {
    color: Colors.white,
    fontSize: RFValue( 12 ),
    fontFamily: Fonts.FiraSansRegular,
    marginLeft: 10,
  },
} )
