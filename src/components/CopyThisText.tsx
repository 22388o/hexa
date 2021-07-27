import React from 'react'
import {
  View,
  Image,
  Text,
} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import Colors from '../common/Colors'
import { RFValue } from 'react-native-responsive-fontsize'
import Toast from '../components/Toast'
import { AppBottomSheetTouchableWrapper } from './AppBottomSheetTouchableWrapper'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'

export default function CopyThisText( props ) {
  function writeToClipboard() {
    Clipboard.setString( props.text )
    Toast( 'Copied Successfully' )
  }

  return (
    <View
      style={{
        marginVertical: hp( 3 ),
        // marginTop: 30,
        paddingLeft: 25,
        paddingRight: 25,
        marginLeft:25, marginRight:25,
        alignItems:'center', justifyContent:'center',
        // flex: 1,
        // width: '90%',
        alignSelf: 'center'
      }}
    >
      <AppBottomSheetTouchableWrapper
        onPress={() => ( props.openLink ? props.openLink() : writeToClipboard() )}
        style={{
          flexDirection: 'row',
        }}
      >
        <View
          style={{
            // flex: 1,
            width:wp( '70%' ),
            backgroundColor: props.backgroundColor ? props.backgroundColor : Colors.backgroundColor,
            borderBottomLeftRadius: wp( 3 ),
            borderTopLeftRadius: wp( 3 ),
            height: wp( props.height ? props.height : '13%' ),
            paddingLeft: 15,
            paddingRight: 15,
            justifyContent: 'center',
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: RFValue( 13 ),
              color: Colors.lightBlue,
            }}
          >
            {props.text}
          </Text>
        </View>
        <View
          style={{
            width: wp( props.width ? props.width : '12%' ),
            height: wp( props.height ? props.height : '13%' ),
            backgroundColor: Colors.borderColor,
            borderTopRightRadius: wp( 3 ),
            borderBottomRightRadius: wp( 3 ),
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image
            style={{
              width: props.openLink ? wp( 6 ) : 18, height: props.openLink ? wp( 6 ) : 20
            }}
            source={
              props.openLink
                ? require( '../assets/images/icons/openlink.png' )
                : require( '../assets/images/icons/icon-copy.png' )
            }
          />
        </View>
      </AppBottomSheetTouchableWrapper>
    </View>
  )
}
