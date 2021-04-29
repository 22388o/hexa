import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { StyleSheet, Modal, View, Image, Text, Platform, TextInput, TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import QRCode from 'react-native-qrcode-svg'
import Fonts from '../../common/Fonts'
import Colors from '../../common/Colors'
import { RFValue } from 'react-native-responsive-fontsize'
import { UsNumberFormat } from '../../common/utilities'
import CopyThisText from '../../components/CopyThisText'
import { AppBottomSheetTouchableWrapper } from '../../components/AppBottomSheetTouchableWrapper'
import Ionicons from 'react-native-vector-icons/Ionicons'
import BottomInfoBox from '../../components/BottomInfoBox'
import { ScrollView } from 'react-native-gesture-handler'
import { getAllAccountsData } from '../../store/actions/accounts'
import { SATOSHIS_IN_BTC } from '../../common/constants/Bitcoin'
import TestAccount from '../../bitcoin/services/accounts/TestAccount'
import RegularAccount from '../../bitcoin/services/accounts/RegularAccount'
import SecureAccount from '../../bitcoin/services/accounts/SecureAccount'
import { AccountsState } from '../../store/reducers/accounts'
import ReceiveAmountContent from '../../components/home/ReceiveAmountContent'
import { useBottomSheetModal } from '@gorhom/bottom-sheet'
import defaultBottomSheetConfigs from '../../common/configs/BottomSheetConfigs'

export type Props = {
  navigation: any;
};

const ReceiveQrScreen: React.FC<Props> = ( { navigation, }: Props ) => {
  const dispatch = useDispatch()
  const [ hideShow, setHideShow ] = useState( false )
  const [ amount, setAmount ] = useState( '' )
  const allAccounts = useSelector(
    ( state ) => state.accounts.accounts,
  )
  const [ selectedAccount, setSelectedAccount ] = useState( null )
  const [ receivingAddress, setReceivingAddress ] = useState( null )

  const {
    present: presentBottomSheet,
    dismiss: dismissBottomSheet,
  } = useBottomSheetModal()

  const [ accounts, setAccounts ] = useState( [] )
  const accountState: AccountsState = useSelector(
    ( state ) => state.accounts,
  )
  useEffect( () => {
    dispatch( getAllAccountsData() )
  }, [] )

  useEffect( () => {
    if ( allAccounts ) {
      setAccounts( allAccounts )
      setSelectedAccount( allAccounts[ 0 ] )
    }
  }, [ allAccounts ] )

  useEffect( () => {
    let receiveAt = selectedAccount && selectedAccount.receivingAddress ? selectedAccount.receivingAddress : ''
    if ( amount ) {
      const service: TestAccount | RegularAccount | SecureAccount = accountState[ selectedAccount.shell.primarySubAccount.sourceKind ].service
      receiveAt = service.getPaymentURI( receiveAt, {
        amount: parseInt( amount ) / SATOSHIS_IN_BTC,
      } ).paymentURI
    }
    setReceivingAddress( receiveAt )
  }, [ amount, selectedAccount ] )

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

  return (
    <View style={styles.rootContainer}>
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

        {hideShow ? (
          <Modal
            animationType='fade'
            transparent={true}
            visible={hideShow}
            onRequestClose={() => { setHideShow( false ) }}>
            <TouchableOpacity style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }} onPress={() => { setHideShow( false ) }}>

              <View style={styles.dropDownView}>
                <ScrollView>
                  {accounts.map( ( value ) => {
                    return (
                      <AppBottomSheetTouchableWrapper activeOpacity={10} onPress={() => {
                        setHideShow( false )
                        setSelectedAccount( value )
                      }}
                      style={{
                        ...styles.dropDownElement,
                      }}>
                        <View style={styles.imageView}>
                          <Image source={value.accountImage} style={{
                            width: wp( '8%' ), height: wp( '8%' )
                          }} />

                        </View>
                        <View style={{
                          marginLeft: wp( '2%' ), alignSelf: 'center',
                        }}>
                          <Text style={styles.accountName}>{value.accountName}</Text>
                          <Text style={styles.balanceText}>Balance {UsNumberFormat( value.balance )} sats</Text>
                        </View>
                      </AppBottomSheetTouchableWrapper>
                    )
                  } )}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        ) : null}

        <View style={styles.text1}>
          <Text style={styles.titleText}>{'Receiving To: '}</Text>
        </View>
        {selectedAccount && <View
          style={{
            marginBottom: hp( '2%' ),
          }}
        >
          <AppBottomSheetTouchableWrapper activeOpacity={10} onPress={() => setHideShow( !hideShow )}
            style={{
              ...styles.dropDownElement,
              borderRadius: 10,
              borderColor: Colors.borderColor,
              borderWidth: 1,
              marginLeft: 20,
              marginRight: 20,
              marginBottom: 20,
            }}>
            <View style={styles.imageView}>
              <Image source={selectedAccount && selectedAccount.accountImage} style={{
                width: wp( '9%' ), height: wp( '9%' )
              }} />
            </View>
            <View style={{
              marginLeft: wp( '2%' ), alignSelf: 'center',
            }}>
              <Text style={styles.accountName}>{selectedAccount && selectedAccount.accountName
                ? selectedAccount.accountName
                : ''}</Text>
              <Text style={styles.balanceText}>Balance {selectedAccount ? selectedAccount.balance : ''} sats</Text>
            </View>
            <View style={{
              marginLeft: 'auto'
            }}>
              <Ionicons
                name="chevron-down-sharp"
                color={Colors.textColorGrey}
                size={15}
                style={styles.forwardIcon}
              />
            </View>
          </AppBottomSheetTouchableWrapper>

        </View>}
        <BottomInfoBox
          title="Note"
          infoText="It would take some time for the sats to reflect in your account based on the network condition"
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create( {
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundColor1
  },
  text: {
    justifyContent: 'center', marginRight: 10, marginLeft: 10, flex: 1
  },
  text1: {
    marginLeft: wp( '5%' ),
    marginRight: wp( '5%' ),
    marginBottom: wp( '5%' )
  },
  forwardIcon: {
    marginLeft: wp( '3%' ),
    marginRight: wp( '3%' ),
    alignSelf: 'center',
  },
  QRView: {
    height: hp( '30%' ),
    justifyContent: 'center',
    marginLeft: 20,
    marginRight: 20,
    alignItems: 'center',
    marginTop: hp( '3%' )
  },
  dropDownElement: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: wp( '2%' ),
    paddingBottom: wp( '2%' ),
    paddingLeft: wp( '3%' ),
    paddingRight: wp( '3%' ),
    width: wp( '90%' ),
  },
  dropDownView: {
    flex: 1,
    marginBottom: hp( '4%' ), marginTop: hp( '60%' ),
    backgroundColor: Colors.white,
    marginLeft: wp( '5%' ),
    marginRight: wp( '5%' ),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  titleText: {
    fontSize: RFValue( 12 ),
    fontFamily: Fonts.FiraSansRegular,
    color: Colors.textColorGrey,
  },
  imageView: {
    width: wp( '15%' ), height: wp( '15%' ), backgroundColor: Colors.backgroundColor, borderRadius: wp( '15%' ) / 2, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.white,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.7,
    shadowColor: Colors.borderColor,
    shadowRadius: 5,
    elevation: 10
  },
  accountName: {
    color: Colors.black, fontFamily: Fonts.FiraSansRegular, fontSize: RFValue( 16 )
  },
  balanceText: {
    color: Colors.blue, fontFamily: Fonts.FiraSansMediumItalic, fontSize: RFValue( 10 ), marginTop: 5
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
} )


export default ReceiveQrScreen


