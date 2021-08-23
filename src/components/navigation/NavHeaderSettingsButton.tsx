import React from 'react'
import { StyleSheet, TouchableOpacity, Image } from 'react-native'
import { heightPercentageToDP } from 'react-native-responsive-screen'


export type Props = {
  onPress: () => void;
  containerStyle?: Record<string, unknown>;
};

const NavHeaderSettingsButton: React.FC<Props> = ( {
  onPress,
  containerStyle,
}: Props ) => {
  return (
    <TouchableOpacity
      style={{
        ...styles.rootContainer, ...containerStyle
      }}
      onPress={onPress}
      hitSlop={{
        top: 20, left: 20, bottom: 20, right: 20
      }}
    >
      <Image
        source={require( '../../assets/images/icons/icon_settings_blue.png' )}
        style={{
          width: 22, height: 22,
          marginTop: heightPercentageToDP( 0.5 )
        }}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create( {
  rootContainer: {
    paddingRight: 16,
  },
} )

export default NavHeaderSettingsButton
