import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Text, Image, TouchableOpacity, ScrollView } from 'react-native'
import { useDispatch } from 'react-redux'
import Colors from '../../../common/Colors'
import Fonts from '../../../common/Fonts'
import ListStyles from '../../../common/Styles/ListStyles'
import ImageStyles from '../../../common/Styles/ImageStyles'
import { RFValue } from 'react-native-responsive-fontsize'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'
import { AppBottomSheetTouchableWrapper } from '../../AppBottomSheetTouchableWrapper'
import useRampIntegrationState from '../../../utils/hooks/state-selectors/accounts/UseRampIntegrationState'
import { fetchRampReceiveAddress, fetchRampReservation } from '../../../store/actions/RampIntegration'
import useRampReservationFetchEffect from '../../../utils/hooks/ramp-integration/UseRampReservationFetchEffect'
import openLink from '../../../utils/OpenLink'
import { ListItem } from 'react-native-elements'
import { AccountType } from '../../../bitcoin/utilities/Interface'
import useReceivingAddressFromAccount from '../../../utils/hooks/account-utils/UseReceivingAddressFromAccount'
import useWallet from '../../../utils/hooks/state-selectors/UseWallet'
import { newAccountsInfo } from '../../../store/sagas/accounts'
import { addNewAccountShells } from '../../../store/actions/accounts'
import DropDown from '../../../utils/Dropdown'

type Props = {
  rampDeepLinkContent: string | null;
  rampFromDeepLink: boolean | null;
  rampFromBuyMenu: boolean | null;
  onClickSetting: ()=>any;
  onPress: () => any;
}

const BottomSheetRampInfo: React.FC<Props> = ( { rampDeepLinkContent, rampFromDeepLink, rampFromBuyMenu, onClickSetting, onPress }: Props ) => {
  const dispatch = useDispatch()
  const { rampHostedUrl } = useRampIntegrationState()
  const [ hasButtonBeenPressed, setHasButtonBeenPressed ] = useState<boolean | false>()
  const wallet = useWallet()
  const [ pickReceiveAddressFrom, setPickReceiveAddressFrom ] = useState( AccountType.CHECKING_ACCOUNT )
  const rampReceiveAddress = useReceivingAddressFromAccount( AccountType.RAMP_ACCOUNT, pickReceiveAddressFrom )
  const [ dropdown, showDropdown ] = useState( false )
  const dropdownBoxList = [ {
    id: 1,
    type: AccountType.CHECKING_ACCOUNT
  },
  {
    id: 2,
    type: AccountType.DEPOSIT_ACCOUNT
  } ]
  function handleProceedButtonPress() {
    if( !hasButtonBeenPressed && rampFromBuyMenu ){dispatch( fetchRampReservation( rampReceiveAddress ) )}
    setHasButtonBeenPressed( true )
  }

  useRampReservationFetchEffect( {
    onSuccess: () => {
      openLink( rampHostedUrl )
      onClickSetting()
    },
    onFailure: () => {
      setHasButtonBeenPressed( true )
    }
  } )

  useEffect( ()=> {
    if( pickReceiveAddressFrom === AccountType.DEPOSIT_ACCOUNT ){
      if( !wallet.accounts[ AccountType.DEPOSIT_ACCOUNT ] ){
      // create deposit account if an instance doesn't exist
        const accountsInfo: newAccountsInfo = {
          accountType: AccountType.DEPOSIT_ACCOUNT,
        }
        dispatch( addNewAccountShells( [ accountsInfo ] ) )
      } else setPickReceiveAddressFrom( AccountType.DEPOSIT_ACCOUNT )
    }
  }, [ pickReceiveAddressFrom, wallet ] )

  // eslint-disable-next-line quotes
  let rampMessage = 'Ramp enables BTC purchases using Apple Pay, Debit/Credit card, Bank Transfer and open banking where available. Payment methods available may vary based on your country.\n\nBy proceeding, you understand that Ramp will process the payment and transfer for the purchased bitcoin.'

  let rampTitle = 'Buy bitcoin with Ramp'

  if( rampFromDeepLink && rampDeepLinkContent ) {
    rampMessage = rampDeepLinkContent.search( 'fail' )>=0
      ? 'Ramp was not able to process your payment. Please try after sometime or use a different payment method'
      : 'Your order is being processed by Ramp, once successful the purchased bitcoin will be transferred to your Ramp account'
    rampTitle = ( rampDeepLinkContent.search( 'fail' )>=0 )
      ? 'Ramp order failed'
      : 'Order being processed'
  }
  return ( <View style={{
    ...styles.modalContentContainer,
  }}>
    <View style={{
      height: hp( 75 )
    }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
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
      <View style={styles.successModalHeaderView}>

        <Text style={styles.modalTitleText}>{rampTitle}</Text>
        <Text style={{
          ...styles.modalInfoText,
          marginTop: wp( 1.5 ),
          marginBottom: wp( 3 ),
        }}>{rampMessage}</Text>
      </View>
      {/* <TouchableOpacity
      onPress={() => showDropdown( true )}
      style={styles.containerStyle}>
      <View style={styles.headerImageView}>
        <View style={styles.headerImageInitials}>
          <Image
            source={require( '../../../assets/images/icons/ramp_logo_notext.png' )}
            style={styles.headerImage}
            resizeMode="contain"
          />
        </View>
      </View>

      <ListItem.Content style={{
        height: wp( '14%' )
      }}>
        <ListItem.Subtitle
          style={[ ListStyles.infoHeaderSubtitleText, {
            // alignSelf: 'flex-start'
          } ]}
          numberOfLines={1}
        >
              Account Type
        </ListItem.Subtitle>
        <ListItem.Title
          style={styles.destinationTitleText}
          numberOfLines={1}
        >
          {pickReceiveAddressFrom}
        </ListItem.Title>
      </ListItem.Content>
    </TouchableOpacity>
    {dropdown ? (
      <DropDown onClose={( value ) => { setPickReceiveAddressFrom( value.type )
        showDropdown( false ) }}
      dropdownBoxList={dropdownBoxList} />
    ) : null} */}
      <View style={styles.containerStyle}>
        <View style={styles.headerImageView}>
          <View style={styles.headerImageInitials}>
            <Image
              source={require( '../../../assets/images/icons/ramp_logo_notext.png' )}
              style={styles.headerImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <ListItem.Content style={{
          height: wp( '14%' )
        }}>
          <ListItem.Subtitle
            style={ListStyles.infoHeaderSubtitleText}
            numberOfLines={1}
          >
              Bitcoin will be transferred to
          </ListItem.Subtitle>

          <ListItem.Title
            style={styles.destinationTitleText}
            numberOfLines={1}
          >
              Checking Account
          </ListItem.Title>
          {/* <ListItem.Subtitle
          style={[ ListStyles.infoHeaderSubtitleText, {
            alignSelf: 'baseline', color: Colors.blue, fontFamily: Fonts.FiraSansMediumItalic
          } ]}
          numberOfLines={1}
        >
              Lorem ipsum dolor amet
        </ListItem.Subtitle> */}
        </ListItem.Content>
      </View>

      <View style={styles.containerStyle}>
        <View style={styles.headerImageView}>
          <View style={styles.headerImageInitials}>
            <Image
              source={require( '../../../assets/images/icons/icon_address_type.png' )}
              style={styles.headerImage}
              resizeMode="contain"
            />
          </View>
        </View>
        <ListItem.Content style={{
          height: wp( '14%' )
        }}>
          <ListItem.Subtitle
            style={ListStyles.infoHeaderSubtitleText}
            numberOfLines={1}
          >
              Bitcoin will be transferred to
          </ListItem.Subtitle>

          <ListItem.Title
            style={styles.destinationTitleText}
            numberOfLines={1}
          >
            {rampReceiveAddress}
          </ListItem.Title>
          {/* <ListItem.Subtitle
          style={[ ListStyles.infoHeaderSubtitleText, {
            alignSelf: 'baseline', color: Colors.blue, fontFamily: Fonts.FiraSansMediumItalic
          } ]}
          numberOfLines={1}
        >
              Lorem ipsum dolor amet
        </ListItem.Subtitle> */}
        </ListItem.Content>
      </View>

      <View style={{
        flexDirection: 'column', alignItems: 'flex-start', marginTop: 'auto'
      }} >
        <AppBottomSheetTouchableWrapper
          disabled={rampFromBuyMenu ? hasButtonBeenPressed : false}
          onPress={rampFromBuyMenu ? handleProceedButtonPress : onClickSetting}
          style={{
            ...styles.successModalButtonView
          }}
        >
          <Text style={styles.proceedButtonText}>{rampFromBuyMenu ? 'Buy bitcoin' : 'OK'}</Text>

        </AppBottomSheetTouchableWrapper>
      </View>
      {rampFromBuyMenu
        ? <View style={{
          alignSelf: 'flex-end',
          flexDirection: 'row',
          alignItems: 'center',
          alignContent: 'center',
          marginTop: hp( '1.5' ),
          marginRight: wp( '6%' ),
          marginBottom: hp( '2%' )
        }}>
          <Text style={{
            fontStyle: 'italic',
            fontSize: RFValue( 11 ),
            color: Colors.textColorGrey
          }}>
        Powered by
          </Text>
          <Image
            source={require( '../../../assets/images/icons/ramp_logo_large.png' )}
            style={{
              marginLeft: 5,
              width: 62,
              height: 27,
            }}
          />
        </View>
        : null
      }
    </View>
  </View>
  )
}

const styles = StyleSheet.create( {
  containerStyle: {
    flexDirection: 'row',
    marginLeft: wp( '3%' ),
    // alignSelf: 'center',
    width: wp( '90%' ),
    height: hp( '11%' ),
    backgroundColor: Colors.white,
    alignItems: 'center',
    marginBottom: wp( 4 ),
    borderRadius: wp( 2 ),
    // elevation: 10,
    // shadowColor: Colors.borderColor,
    // shadowOpacity: 10,
    // shadowOffset: {
    //   width: 2, height: 2
    // },
  },
  headerImageView: {
    width: wp( '15%' ),
    height: wp( '15%' ),
    borderColor: 'red',
    elevation: 10,
    shadowColor: Colors.borderColor,
    shadowOpacity: 10,
    shadowOffset: {
      width: 2, height: 2
    },
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp( '15%' ) / 2,
    margin: 5
  },
  headerImage: {
    width: wp( '7%' ),
    height: wp( '7%' ),
    borderRadius: wp( '7%' ) / 2,
  },
  headerImageInitials: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundColor,
    width: wp( '13%' ),
    height: wp( '13%' ),
    borderRadius: wp( '13%' ) / 2,
  },
  modalContentContainer: {
    backgroundColor: Colors.backgroundColor1,
  },
  avatarImage: {
    ...ImageStyles.circledAvatarContainer,
    ...ImageStyles.thumbnailImageLarge,
    borderRadius: wp( 14 )/2,
    // marginRight: wp( 16 ),
  },
  destinationTitleText: {
    fontFamily: Fonts.FiraSansRegular,
    fontSize: RFValue( 20 ),
    color: Colors.black,
    alignContent: 'center',
    marginVertical: hp( 0.3 )
  },
  successModalHeaderView: {
    marginRight: wp( '10%' ),
    marginLeft: wp( '3%' ),
  },
  modalTitleText: {
    color: Colors.blue,
    fontSize: RFValue( 18 ),
    fontFamily: Fonts.FiraSansRegular,
    width: wp( 30 ),
    marginLeft: 10
  },
  modalInfoText: {
    marginLeft: wp( '3%' ),
    marginRight: wp( 4 ),
    color: Colors.textColorGrey,
    fontSize: RFValue( 12 ),
    fontFamily: Fonts.FiraSansRegular,
    textAlign: 'justify',
    letterSpacing: 0.6,
    lineHeight: 18
  },
  successModalButtonView: {
    paddingHorizontal: wp( 4 ),
    paddingVertical: wp( 3 ),
    height: wp( '13%' ),
    width: wp( '36%' ),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 11,
    elevation: 10,
    shadowColor: Colors.shadowBlue,
    shadowOpacity: 1,
    shadowOffset: {
      width: 15, height: 15
    },
    backgroundColor: Colors.blue,
    alignSelf: 'flex-start',
    marginLeft: wp( '6%' ),
    marginTop: hp( 2 )
  },
  successModalImage: {
    width: wp( '25%' ),
    height: hp( '18%' ),
    marginLeft: 'auto',
    resizeMode: 'cover'
  },
  proceedButtonText: {
    color: Colors.white,
    fontSize: RFValue( 13 ),
    fontFamily: Fonts.FiraSansMedium
  },
} )

export default BottomSheetRampInfo
