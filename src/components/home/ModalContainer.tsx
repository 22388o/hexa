import React, { useEffect, useState } from 'react'
import { TouchableOpacity, TouchableWithoutFeedback, Modal, View, Keyboard } from 'react-native'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'

const ModalContainer = ( {
  visible,
  closeBottomSheet,
  background = 'rgba(0,0,0,0.5)',
  children
} ) => {
  const [ height, setHeight ] = useState( 9 )
  useEffect( ()=>{
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setHeight( 0 )
      }
    )
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setHeight( 9 )
      }
    )

    return () => {
      keyboardDidHideListener.remove()
      keyboardDidShowListener.remove()
    }
  }, [] )
  return(
    <Modal
      visible={visible}
      onRequestClose={() => { closeBottomSheet() }}
      transparent={true}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressOut={() => {
          closeBottomSheet()
        }}
        style={{
          // flex: 1,
          backgroundColor: background,
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: hp( `${height}%` )
          // borderRadius: 20

        }}
      >
        <TouchableWithoutFeedback>
          <View style={{
            width: '95%',
            borderRadius: wp( '2%' ),
            overflow: 'hidden',
          }}>

            {children}
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  )
}

export default ModalContainer
