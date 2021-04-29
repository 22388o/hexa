import React, { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  SafeAreaView,
  StatusBar,
  AsyncStorage,
  Alert,
} from 'react-native'
import { RFValue } from 'react-native-responsive-fontsize'
import NavStyles from '../../common/Styles/NavStyles'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import Colors from '../../common/Colors'
import Fonts from '../../common/Fonts'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import BottomInfoBox from '../../components/BottomInfoBox'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { AppBottomSheetTouchableWrapper } from '../../components/AppBottomSheetTouchableWrapper'
import BottomSheet from 'reanimated-bottom-sheet'

import {
  SECURE_ACCOUNT,
  TEST_ACCOUNT,
} from '../../common/constants/wallet-service-types'

import {
  setReceiveHelper,
  setSavingWarning,
} from '../../store/actions/preferences'
import { getAccountIcon, getAccountTitle } from './Send/utils'
import KnowMoreButton from '../../components/KnowMoreButton'
import QRCode from 'react-native-qrcode-svg'
import CopyThisText from '../../components/CopyThisText'
import ReceiveAmountContent from '../../components/home/ReceiveAmountContent'
import defaultBottomSheetConfigs from '../../common/configs/BottomSheetConfigs'
import { useBottomSheetModal } from '@gorhom/bottom-sheet'
import { SATOSHIS_IN_BTC } from '../../common/constants/Bitcoin'
import SmallHeaderModal from '../../components/SmallHeaderModal'
import ReceiveHelpContents from '../../components/Helper/ReceiveHelpContents'
import idx from 'idx'
import TwoFASetupWarningModal from './TwoFASetupWarningModal'
import DeviceInfo from 'react-native-device-info'

export default function Receive( props ) {

  const [ ReceiveHelperBottomSheet ] = useState( React.createRef() )
  const [ isReceiveHelperDone, setIsReceiveHelperDone ] = useState( true )
  const isReceiveHelperDoneValue = useSelector( ( state ) =>
    idx( state, ( _ ) => _.preferences.isReceiveHelperDoneValue ),
  )

  const savingWarning = useSelector( ( state ) =>
    idx( state, ( _ ) => _.preferences.savingWarning ),
  )

  const [ SecureReceiveWarningBottomSheet ] = useState( React.createRef() )

  const [ amount, setAmount ] = useState( '' )
  const [ serviceType ] = useState(
    props.navigation.getParam( 'serviceType' )
      ? props.navigation.getParam( 'serviceType' )
      : '',
  )
  const derivativeAccountDetails =
    props.navigation.state.params.derivativeAccountDetails
  const dispatch = useDispatch()

  const [ receivingAddress, setReceivingAddress ] = useState( null )

  const {
    present: presentBottomSheet,
    dismiss: dismissBottomSheet,
  } = useBottomSheetModal()
  const { service } = useSelector( ( state ) => state.accounts[ serviceType ] )


  const onPressTouchableWrapper = () => {
    if ( ReceiveHelperBottomSheet.current )
      ( ReceiveHelperBottomSheet as any ).current.snapTo( 0 )
  }

  const onPressBack = () => {
    props.navigation.goBack()
  }

  const onPressKnowMore = () => {
    dispatch( setReceiveHelper( true ) )
    if ( ReceiveHelperBottomSheet.current )
      ( ReceiveHelperBottomSheet as any ).current.snapTo( 1 )
  }

  const onPressReceiveHelperHeader = () => {
    if ( isReceiveHelperDone ) {
      if ( ReceiveHelperBottomSheet.current )
        ( ReceiveHelperBottomSheet as any ).current.snapTo( 1 )
      setTimeout( () => {
        setIsReceiveHelperDone( false )
      }, 10 )
    } else {
      if ( ReceiveHelperBottomSheet.current )
        ( ReceiveHelperBottomSheet as any ).current.snapTo( 0 )
    }
  }

  const checkNShowHelperModal = async () => {
    const isReceiveHelperDone1 = isReceiveHelperDoneValue
    if ( !isReceiveHelperDone1 ) {
      await AsyncStorage.getItem( 'isReceiveHelperDone' )
    }
    if ( !isReceiveHelperDone1 && serviceType == TEST_ACCOUNT ) {
      dispatch( setReceiveHelper( true ) )
      //await AsyncStorage.setItem('isReceiveHelperDone', 'true');
      setTimeout( () => {
        setIsReceiveHelperDone( true )
      }, 10 )
      setTimeout( () => {
        if ( ReceiveHelperBottomSheet.current )
          ( ReceiveHelperBottomSheet as any ).current.snapTo( 1 )
      }, 1000 )
    } else {
      setTimeout( () => {
        setIsReceiveHelperDone( false )
      }, 10 )
    }
  }

  useEffect( () => {
    checkNShowHelperModal()
    //(async () => {
    if ( serviceType === SECURE_ACCOUNT ) {
      if ( !savingWarning ) {
        //await AsyncStorage.getItem('savingsWarning')
        // TODO: integrate w/ any of the PDF's health (if it's good then we don't require the warning modal)
        if ( SecureReceiveWarningBottomSheet.current )
          ( SecureReceiveWarningBottomSheet as any ).current.snapTo( 1 )
        dispatch( setSavingWarning( true ) )
        //await AsyncStorage.setItem('savingsWarning', 'true');
      }
    }
    //})();
  }, [] )

  const onPressOkOf2FASetupWarning = () => {
    if ( SecureReceiveWarningBottomSheet.current )
      ( SecureReceiveWarningBottomSheet as any ).current.snapTo( 0 )
  }

  const showReceiveAmountBottomSheet = useCallback( () => {
    presentBottomSheet(
      <ReceiveAmountContent
        title={'Receive sats'}
        message={'Receive sats into the selected account'}
        onPressConfirm={( amount ) => {
          setAmount( amount )
          dismissBottomSheet()
        }}
        selectedAmount={amount}
        onPressBack={() => {
          dismissBottomSheet()
        }
        }
      />,
      {
        ...defaultBottomSheetConfigs,
        snapPoints: [ 0, '50%' ],
        overlayOpacity: 0.9,
      },
    )
  }, [ presentBottomSheet, dismissBottomSheet, amount ] )

  useEffect( () => {
    const receivingAddress = service.getReceivingAddress(
      derivativeAccountDetails ? derivativeAccountDetails.type : null,
      derivativeAccountDetails ? derivativeAccountDetails.number : null,
    )
    let receiveAt = receivingAddress ? receivingAddress : ''
    if ( amount ) {
      receiveAt = service.getPaymentURI( receiveAt, {
        amount: parseInt( amount ) / SATOSHIS_IN_BTC,
      } ).paymentURI
    }
    setReceivingAddress( receiveAt )

  }, [ service, amount, ] )

  return (
    <View style={{
      flex: 1
    }}>
      <SafeAreaView style={{
        flex: 0
      }} />
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
      <TouchableWithoutFeedback onPress={() => onPressTouchableWrapper()}>
        <KeyboardAvoidingView
          style={{
            flex: 1
          }}
          behavior={Platform.OS == 'ios' ? 'padding' : ''}
          enabled
        >
          <View style={NavStyles.modalContainer}>
            <View style={NavStyles.modalHeaderTitleView}>
              <View
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'stretch'
                }}
              >
                <TouchableOpacity
                  onPress={() => onPressBack()}
                  style={{
                    height: 30, width: 30, justifyContent: 'center'
                  }}
                >
                  <FontAwesome
                    name="long-arrow-left"
                    color={Colors.blue}
                    size={17}
                  />
                </TouchableOpacity>
                <Image
                  source={
                    getAccountIcon( serviceType, derivativeAccountDetails )
                  }
                  style={{
                    width: wp( '10%' ), height: wp( '10%' )
                  }}
                />
                <View style={{
                  marginLeft: wp( '2.5%' )
                }}>
                  <Text style={NavStyles.modalHeaderTitleText}>Receive</Text>
                  <Text
                    style={{
                      color: Colors.textColorGrey,
                      fontFamily: Fonts.FiraSansRegular,
                      fontSize: RFValue( 12 ),
                    }}
                  >
                    {
                      getAccountTitle( serviceType, derivativeAccountDetails )
                    }
                  </Text>
                </View>
              </View>
              {serviceType == TEST_ACCOUNT ? (
                <KnowMoreButton
                  onpress={() => onPressKnowMore()}
                  containerStyle={{
                    marginTop: 'auto',
                    marginBottom: 'auto',
                    marginRight: 10,
                  }}
                />
              ) : null}
            </View>
            <ScrollView>
              <View style={styles.QRView}>
                <QRCode value={'{"encryptedSecret":"edf1d90bb2b7876c997125b6a331aee706083c108e31ec858a38972de5636e3d7eb253e54a0276c8e16ce6996de946cadffd48e40fdc402efa42bd627086f6f54777c3f2830bb394a4b52adf20304307d771b337f118d9de562d1c7a28b92c677740cfd1635e8e8a6be8bf560c599560504dbf4115bcbc97c3a27a3a1ceddbc10eed1e5ea80f7d66531d9d6e679cffd5dd9963b1b8ce2f9df38b24e92834d407cf5cab497bb0a36f87b79cd2f4651caab1654e5cef20712f2d836618b02a8be78f814ff1db1498f279f51b69fc8a232641943fb299a862191278b219de34b8f63fbe26cca78f3d30edfdf60d7e323a21310feb0a2cdf2cd43a83891bac5ff4583a6fff318091aecc71b93494b381c5de70364e6d548f0b15fff3cfbeae2fb4c91c109515c3e02020bf9df6f3547ae6dfd377627f43028cb08e46b7e61a7604cba48666a08d1b5bdc17f7a2f4eaca02d41ad9aad52bc2d775d520eae3c49728f8437af35af7e9e972af59817f625422d752b7b8eecd1e917451e3912004b4edfb1ee5d25658cf8b0e36f57b365163481a7bbaec391e85891aa75e6d2dbd3cde70d2278373ddcb287ce53b25301265196931fbac3276535290e8fb3ac206d5883dd8c86563222304245fa19ebc42a35954def4c1048fff13031f15d6cce1122fdf9871e5753fa2a0d0ead722072c59ea8ef0b882fdb244d4f46a81b1cfb4329593c82d32738eb8a57e2ed950fc61d677dbecdbee75a2190002ca97ffe1d3548adcd2fdf64ccd71fd2900243e38cd2c356a1fb4c3a3ca15e76694194e644b0d8a079e97740ba6c95c1805f9762c54efdd4cd7a750ad7ca7fa58cf92e154d5ca6ca5332dabb3c1a94c1ee72a989d95742757c94c1deb7f0efe3d3c794e64909fdc0587826cc572da1061e607f8507d5b4abf","shareId":"30e0d615ad93b66d4d9414ae3f716dbe48ca4c78753ab0ac254c2940c7675e11","meta":{"version":"1.6.0","validator":"HEXA","index":0,"walletId":"327c4090490845cb2166b10aa8deea8f27691f9720b9e1d95287351d84966317","tag":"Dem","timestamp":"29/04/2021, 10:26","reshareVersion":0,"questionId":"1","question":""},"encryptedStaticNonPMDD":"bde5c104cbfc74db6d6026f72bdba0f85b26e071c5dfa2b1421e2ba1d3fffe4dc283988163a70d42ef8bc079404f93a9a71bb99a0c91515e27900f8f78f40c76f164fd0ae93b98a90af4d3198876afc6643aa1003a2c60f1ff1dad6426fa216358f3987c826c0b33ac14d9571daf310436292091a95a8b50d61655d144f7ee9da471fde431c3a82d9d462e32dfbcd203fe173a4cb88606b6a75dc07f642e033f9977ad342d63484e42e5d1c5e4d6c3bae7f4c58a30d289e5258e484bffdc65a1a297013a479307a42746db3119d9c61c04347633204b7716bd4fc0f0d07aaf29232c13600abf07bbe9abab14683f47fbbeb037a29c5e67ee5a4c6052424438e9"}'} size={hp( '27%' )} />
              </View>

              <CopyThisText
                backgroundColor={Colors.white}
                text={'{"encryptedSecret":"edf1d90bb2b7876c997125b6a331aee706083c108e31ec858a38972de5636e3d7eb253e54a0276c8e16ce6996de946cadffd48e40fdc402efa42bd627086f6f54777c3f2830bb394a4b52adf20304307d771b337f118d9de562d1c7a28b92c677740cfd1635e8e8a6be8bf560c599560504dbf4115bcbc97c3a27a3a1ceddbc10eed1e5ea80f7d66531d9d6e679cffd5dd9963b1b8ce2f9df38b24e92834d407cf5cab497bb0a36f87b79cd2f4651caab1654e5cef20712f2d836618b02a8be78f814ff1db1498f279f51b69fc8a232641943fb299a862191278b219de34b8f63fbe26cca78f3d30edfdf60d7e323a21310feb0a2cdf2cd43a83891bac5ff4583a6fff318091aecc71b93494b381c5de70364e6d548f0b15fff3cfbeae2fb4c91c109515c3e02020bf9df6f3547ae6dfd377627f43028cb08e46b7e61a7604cba48666a08d1b5bdc17f7a2f4eaca02d41ad9aad52bc2d775d520eae3c49728f8437af35af7e9e972af59817f625422d752b7b8eecd1e917451e3912004b4edfb1ee5d25658cf8b0e36f57b365163481a7bbaec391e85891aa75e6d2dbd3cde70d2278373ddcb287ce53b25301265196931fbac3276535290e8fb3ac206d5883dd8c86563222304245fa19ebc42a35954def4c1048fff13031f15d6cce1122fdf9871e5753fa2a0d0ead722072c59ea8ef0b882fdb244d4f46a81b1cfb4329593c82d32738eb8a57e2ed950fc61d677dbecdbee75a2190002ca97ffe1d3548adcd2fdf64ccd71fd2900243e38cd2c356a1fb4c3a3ca15e76694194e644b0d8a079e97740ba6c95c1805f9762c54efdd4cd7a750ad7ca7fa58cf92e154d5ca6ca5332dabb3c1a94c1ee72a989d95742757c94c1deb7f0efe3d3c794e64909fdc0587826cc572da1061e607f8507d5b4abf","shareId":"30e0d615ad93b66d4d9414ae3f716dbe48ca4c78753ab0ac254c2940c7675e11","meta":{"version":"1.6.0","validator":"HEXA","index":0,"walletId":"327c4090490845cb2166b10aa8deea8f27691f9720b9e1d95287351d84966317","tag":"Dem","timestamp":"29/04/2021, 10:26","reshareVersion":0,"questionId":"1","question":""},"encryptedStaticNonPMDD":"bde5c104cbfc74db6d6026f72bdba0f85b26e071c5dfa2b1421e2ba1d3fffe4dc283988163a70d42ef8bc079404f93a9a71bb99a0c91515e27900f8f78f40c76f164fd0ae93b98a90af4d3198876afc6643aa1003a2c60f1ff1dad6426fa216358f3987c826c0b33ac14d9571daf310436292091a95a8b50d61655d144f7ee9da471fde431c3a82d9d462e32dfbcd203fe173a4cb88606b6a75dc07f642e033f9977ad342d63484e42e5d1c5e4d6c3bae7f4c58a30d289e5258e484bffdc65a1a297013a479307a42746db3119d9c61c04347633204b7716bd4fc0f0d07aaf29232c13600abf07bbe9abab14683f47fbbeb037a29c5e67ee5a4c6052424438e9"}'}
              />

              <AppBottomSheetTouchableWrapper
                onPress={() => { showReceiveAmountBottomSheet() }}
                style={styles.selectedView}
              >
                <View
                  style={styles.text}
                >
                  <Text style={styles.titleText}>{'Enter amount to receive'}</Text>
                </View>

                <View style={{
                  marginLeft: 'auto'
                }}>
                  <Ionicons
                    name="chevron-forward"
                    color={Colors.textColorGrey}
                    size={15}
                    style={styles.forwardIcon}
                  />
                </View>
              </AppBottomSheetTouchableWrapper>

            </ScrollView>
            <View style={{
              marginBottom: hp( '2.5%' )
            }}>
              <BottomInfoBox
                title="Note"
                infoText="It would take some time for the sats to reflect in your account based on the network condition"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <BottomSheet
        enabledInnerScrolling={true}
        ref={ReceiveHelperBottomSheet as any}
        snapPoints={[ -50, hp( '89%' ) ]}
        renderContent={() => (
          <ReceiveHelpContents
            titleClicked={() => {
              if ( ReceiveHelperBottomSheet.current )
                ( ReceiveHelperBottomSheet as any ).current.snapTo( 0 )
            }}
          />
        )}
        renderHeader={() => (
          <SmallHeaderModal
            borderColor={Colors.blue}
            backgroundColor={Colors.blue}
            onPressHeader={() => onPressReceiveHelperHeader()}
          />
        )}
      />

      <BottomSheet
        enabledInnerScrolling={true}
        enabledGestureInteraction={false}
        ref={SecureReceiveWarningBottomSheet as any}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp( '35%' ) : hp( '40%' ),
        ]}
        renderContent={() => (
          <TwoFASetupWarningModal
            onPressOk={() => onPressOkOf2FASetupWarning()}
            //onPressManageBackup={() => props.navigation.replace('ManageBackup')}
          />
        )}
        renderHeader={() => (
          <SmallHeaderModal
            borderColor={Colors.borderColor}
            backgroundColor={Colors.white}
            // onPressHeader={() => {
            //   if (SecureReceiveWarningBottomSheet.current)
            //     (SecureReceiveWarningBottomSheet as any).current.snapTo(0);
            // }}
          />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create( {
  textBoxView: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    height: 50,
    marginBottom: hp( '1%' ),
  },
  textBoxImage: {
    width: wp( '6%' ),
    height: wp( '6%' ),
    resizeMode: 'contain',
  },
  amountInputImage: {
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.borderColor,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  textBox: {
    flex: 1,
    paddingLeft: 20,
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansMedium,
    fontSize: RFValue( 13 ),
  },
  QRView: {
    height: hp( '30%' ),
    justifyContent: 'center',
    marginLeft: 20,
    marginRight: 20,
    alignItems: 'center',
    marginTop: hp( '3%' )
  },
  titleText: {
    fontSize: RFValue( 12 ),
    fontFamily: Fonts.FiraSansRegular,
    color: Colors.textColorGrey,
  },
  text: {
    justifyContent: 'center', marginRight: 10, marginLeft: 10, flex: 1
  },
  knowMoreTouchable: {
    color: Colors.textColorGrey,
    fontSize: RFValue( 12 ),
    marginLeft: 'auto',
  },
  selectedView: {
    marginLeft: wp( '5%' ),
    marginRight: wp( '5%' ),
    marginBottom: hp( 4 ),
    marginTop: hp( 2 ),
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 20,
    borderBottomColor: Colors.borderColor,
    borderBottomWidth: 1,
  },
  forwardIcon: {
    marginLeft: wp( '3%' ),
    marginRight: wp( '3%' ),
    alignSelf: 'center',
  },
  text1: {
    marginLeft: wp( '5%' ),
    marginRight: wp( '5%' ),
    marginBottom: wp( '5%' )
  },
} )
