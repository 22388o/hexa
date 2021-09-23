import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Text,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import { useDispatch, useSelector } from 'react-redux'
import Colors from '../../common/Colors'
import Fonts from '../../common/Fonts'
import { RFValue } from 'react-native-responsive-fontsize'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import HeaderTitle from '../../components/HeaderTitle'
import CommonStyles from '../../common/Styles/Styles'
import CheckingAccount from '../../assets/images/accIcons/icon_checking.svg'
import Dollar from '../../assets/images/svgs/icon_dollar.svg'
import CheckMark from '../../assets/images/svgs/checkmark.svg'
import ModalContainer from '../../components/home/ModalContainer'
import DashedContainer from './DashedContainer'
import GiftCard from '../../assets/images/svgs/icon_gift.svg'
import BottomInfoBox from '../../components/BottomInfoBox'
import Illustration from '../../assets/images/svgs/illustration.svg'
import { generateGifts } from '../../store/actions/accounts'
import { AccountsState } from '../../store/reducers/accounts'
import { AccountType, Gift } from '../../bitcoin/utilities/Interface'
import idx from 'idx'
import useSpendableBalanceForAccountShell from '../../utils/hooks/account-utils/UseSpendableBalanceForAccountShell'
import usePrimarySubAccountForShell from '../../utils/hooks/account-utils/UsePrimarySubAccountForShell'
import useFormattedUnitText from '../../utils/hooks/formatting/UseFormattedUnitText'
import BitcoinUnit from '../../common/data/enums/BitcoinUnit'
import AccountShell from '../../common/data/models/AccountShell'

const CreateGift = ( { navigation } ) => {
  const dispatch = useDispatch()
  const accountsState: AccountsState = useSelector( state => state.accounts )
  const [ pswdInputStyle, setPswdInputStyle ] = useState( styles.inputBox )
  const [ amount, setAmount ] = useState( '' )
  const [ initGiftCreation, setInitGiftCreation ] = useState( false )
  const [ includeFees, setFees ] = useState( false )
  const [ giftModal, setGiftModal ] =useState( false )
  const [ createdGift, setCreatedGift ] = useState( null )
  const accountShells: AccountShell[] = useSelector( ( state ) => idx( state, ( _ ) => _.accounts.accountShells ) )
  const sendingAccount = accountShells.find( shell => shell.primarySubAccount.type == AccountType.CHECKING_ACCOUNT && shell.primarySubAccount.instanceNumber === 0 )
  const sourcePrimarySubAccount = usePrimarySubAccountForShell( sendingAccount )
  const spendableBalance = useSpendableBalanceForAccountShell( sendingAccount )

  const formattedUnitText = useFormattedUnitText( {
    bitcoinUnit: BitcoinUnit.SATS,
  } )

  const sourceAccountHeadlineText = useMemo( () => {
    const title = sourcePrimarySubAccount.customDisplayName || sourcePrimarySubAccount.defaultTitle

    return `${title}`
    // return `${title} (${strings.availableToSpend}: ${formattedAvailableBalanceAmountText} ${formattedUnitText})`

  }, [ sourcePrimarySubAccount ] )

  useEffect( () => {
    if( accountsState.selectedGiftId && initGiftCreation ) {
      const createdGift = accountsState.gifts[ accountsState.selectedGiftId ]
      if( createdGift ){
        setCreatedGift( createdGift )
        setGiftModal( true )
        setInitGiftCreation( false )
      }
    }
  }, [ accountsState.selectedGiftId, initGiftCreation ] )

  const numberWithCommas = ( x ) => {
    return x ? x.toString().replace( /\B(?=(\d{3})+(?!\d))/g, ',' ) : ''
  }

  const renderButton = ( text ) => {
    const isDisabled = spendableBalance <= 0 || ( parseInt( amount ? amount :  '0' ) <= 0 || parseInt( amount ? amount :  '0' ) > spendableBalance )
    return(
      <TouchableOpacity
        disabled={isDisabled}
        onPress={()=>{

          switch( text ){
              case 'Create Gift':
                dispatch( generateGifts( {
                  amounts: [ Number( amount ) ],
                  includeFee: includeFees
                } ) )
                setInitGiftCreation( true )
                break

              case 'Add F&F and Send':
                setGiftModal( false )
                navigation.navigate( 'AddContact', {
                  fromScreen: 'Gift',
                  giftId: ( createdGift as Gift ).id
                } )
                break

              case 'Send Gift':
                setGiftModal( false )
                navigation.navigate( 'SendGift', {
                  giftId: ( createdGift as Gift ).id,
                } )
                break
          }
        }}
        style={isDisabled ? {
          ...styles.disabledButtonView
        } : {
          ...styles.buttonView
        }
        }
      >
        <Text style={styles.buttonText}>{text}</Text>
      </TouchableOpacity>
    )
  }

  const renderCreateGiftModal =()=>{
    return(
      <View style={styles.modalContentContainer}>
        <View style={{
          marginTop: 'auto', right: 0, bottom: 0, position: 'absolute', marginLeft: 'auto'
        }}>
          <Illustration />
        </View>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setGiftModal( false )
            navigation.goBack()
          }}
          style={{
            width: wp( 7 ), height: wp( 7 ), borderRadius: wp( 7/2 ),
            alignSelf: 'flex-end',
            backgroundColor: Colors.lightBlue, alignItems: 'center', justifyContent: 'center',
            marginTop: wp( 3 ), marginRight: wp( 3 )
          }}
        >
          <FontAwesome name="close" color={Colors.white} size={19} style={{
          // marginTop: hp( 0.5 )
          }} />
        </TouchableOpacity>
        <View>
          <View style={{
            marginLeft: wp( 6 ),
          }}>
            <Text style={styles.modalTitleText}>Gift Created</Text>
            <Text style={{
              ...styles.modalInfoText,
            }}>Lorem ipsum dolor Lorem dolor sit amet, consectetur dolor sit</Text>
          </View>
          <DashedContainer
            titleText={'Available Gift'}
            subText={'Lorem ipsum dolor sit amet'}
            amt={numberWithCommas( createdGift.amount )}
            date={new Date()}
            image={<GiftCard />}
          />


          <BottomInfoBox
            containerStyle={{
              paddingRight: wp( 15 ),
              backgroundColor: 'transparent'
            }}
            infoText={'Lorem ipsum dolor sit amet, consectetur adipiscing elit'}
          />

        </View>
        <View style={{
          marginLeft: wp( 4 ), flexDirection: 'row'
        }}>
          {renderButton( 'Send Gift' )}
          {renderButton( 'Add F&F and Send' )}
        </View>
      </View>
    )
  }
  return (
    <ScrollView contentContainerStyle={{
      flexGrow: 1
    }}
    keyboardShouldPersistTaps='handled'
    >
      <SafeAreaView style={styles.viewContainer}>
        <StatusBar backgroundColor={Colors.backgroundColor} barStyle="dark-content" />
        {giftModal &&
      <ModalContainer visible={giftModal} closeBottomSheet={() => {}} >
        {renderCreateGiftModal()}
      </ModalContainer>
        }
        <View style={[ CommonStyles.headerContainer, {
          backgroundColor: Colors.backgroundColor
        } ]}>
          <TouchableOpacity
            style={CommonStyles.headerLeftIconContainer}
            onPress={() => {
              navigation.goBack()
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
        <View style={{
          flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginRight: wp( 4 )
        }}>
          <HeaderTitle
            firstLineTitle={'Create Gift'}
            secondLineTitle={'You can choose to send it to anyone using the QR or the link'}
            infoTextNormal={''}
            infoTextBold={''}
            infoTextNormal1={''}
            step={''}
          />
        </View>
        <TouchableOpacity
          style={{
            width: '90%',
            // height: '54%',
            backgroundColor: Colors.gray7,
            shadowOpacity: 0.06,
            shadowOffset: {
              width: 10, height: 10
            },
            shadowRadius: 10,
            elevation: 2,
            alignSelf: 'center',
            borderRadius: wp( 2 ),
            marginTop: hp( 3 ),
            marginBottom: hp( 1 ),
            paddingVertical: hp( 2 ),
            paddingHorizontal: wp( 2 ),
            flexDirection: 'row'
          }}>
          <CheckingAccount />
          <View style={{
            marginHorizontal: wp( 3 )
          }}>
            <Text style={{
              color: Colors.gray4,
              fontSize: RFValue( 10 ),
              fontFamily: Fonts.FiraSansRegular,
            }}>
                Bitcoin will be deducted from
            </Text>
            <Text
              style={{
                color: Colors.black,
                fontSize: RFValue( 14 ),
                fontFamily: Fonts.FiraSansRegular,
              }}
            >
              {sourceAccountHeadlineText}
            </Text>
            <Text style={styles.availableToSpendText}>
            Available to spend
              <Text style={styles.balanceText}> {spendableBalance} {formattedUnitText}</Text>
            </Text>
          </View>
        </TouchableOpacity>
        <KeyboardAvoidingView
          style={{
            ...pswdInputStyle,
            flexDirection: 'row',
            alignItems: 'center',
            borderColor: Colors.white,
            marginTop: 10,
            backgroundColor: Colors.white,
            paddingHorizontal: wp( 3 )
          }}
        >
          <Dollar />

          <View style={{
            width: wp( 0.5 ), backgroundColor: Colors.borderColor, height: hp( 2.5 ), marginHorizontal: wp( 4 )
          }} />
          <TextInput
            style={styles.modalInputBox}
            placeholder={'Enter amount'}
            placeholderTextColor={Colors.borderColor}
            value={amount}
            keyboardType={'numeric'}
            onChangeText={( text ) => {setAmount( text )}}
          />
        </KeyboardAvoidingView>
        <View style={{
          marginVertical: hp( 5 ),
          marginHorizontal: wp( 7 ),
          flexDirection: 'row'
        }}>
          <TouchableOpacity
            onPress={() => setFees( !includeFees )}
            style={styles.imageView}>
            {includeFees &&
            <CheckMark />
            }
          </TouchableOpacity>
          <Text style={{
            color: Colors.textColorGrey,
            fontSize: RFValue( 12 ),
            fontFamily: Fonts.FiraSansRegular,
            marginHorizontal: wp( 3 )
          }}>
          Include fee in amount
          </Text>
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center', marginHorizontal: wp( 6 )
        }}>


          {renderButton( 'Create Gift' )}
          <TouchableOpacity
            onPress={() => {navigation.goBack()}}
            style={{
              height: wp( '12%' ),
              width: wp( '27%' ),
              justifyContent: 'center',
              alignItems: 'center',
              paddingLeft: wp( '8%' ),
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.FiraSansMedium,
                color: Colors.blue
              }}
            >
              {'Cancel'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create( {
  modalTitleText: {
    color: Colors.blue,
    fontSize: RFValue( 18 ),
    fontFamily: Fonts.FiraSansRegular,
  },
  modalInfoText: {
    color: Colors.textColorGrey,
    fontSize: RFValue( 12 ),
    fontFamily: Fonts.FiraSansRegular,
    marginRight: wp( 10 )
  },
  modalContentContainer: {
    backgroundColor: Colors.backgroundColor,
    paddingBottom: hp( 4 ),
  },
  viewContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundColor,
  },
  buttonText: {
    color: Colors.white,
    fontSize: RFValue( 13 ),
    fontFamily: Fonts.FiraSansMedium,
  },
  buttonView: {
    height: wp( '12%' ),
    // width: wp( '27%' ),
    paddingHorizontal: wp( 2 ),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: Colors.shadowBlue,
    shadowOpacity: 1,
    shadowOffset: {
      width: 15, height: 15
    },
    backgroundColor: Colors.blue,
    marginLeft: wp( 2 )
  },
  disabledButtonView: {
    height: wp( '12%' ),
    width: wp( '27%' ),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: Colors.shadowBlue,
    shadowOpacity: 1,
    shadowOffset: {
      width: 15, height: 15
    },
    backgroundColor: Colors.lightBlue,
    marginLeft: wp( 2 )
  },
  imageView: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 1, height: 1
    },
  },
  modalInputBox: {
    flex: 1,
    height: 50,
    fontSize: RFValue( 13 ),
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansRegular,
    backgroundColor: Colors.white,
  },
  inputBox: {
    borderWidth: 0.5,
    borderRadius: 10,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: Colors.white,
  },
  inputBoxFocused: {
    borderWidth: 0.5,
    borderRadius: 10,
    marginLeft: 20,
    marginRight: 20,
    elevation: 10,
    shadowColor: Colors.borderColor,
    shadowOpacity: 10,
    shadowOffset: {
      width: 10, height: 10
    },
    backgroundColor: Colors.white,
  },
  accImage:{
    marginRight: wp( 4 )
  },
  availableToSpendText: {
    color: Colors.blue,
    fontSize: RFValue( 10 ),
    fontFamily: Fonts.FiraSansItalic,
    lineHeight: 15,
  },
  balanceText: {
    color: Colors.blue,
    fontSize: RFValue( 10 ),
    fontFamily: Fonts.FiraSansItalic,
  },
  proceedButtonText: {
    color: Colors.blue,
    fontSize: RFValue( 13 ),
    fontFamily: Fonts.FiraSansMedium
  },
  selectedContactsView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.blue,
    borderRadius: wp ( 2 ),
    height: hp( 4 ),
    paddingHorizontal: wp( 2 )
  },
  contactText: {
    fontSize: RFValue( 13 ),
    fontFamily: Fonts.FiraSansRegular,
    color: Colors.white,
  },
} )

export default CreateGift

