import React, { useState, useEffect, useCallback, createRef } from 'react'
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Text,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  TextInput,
  Image,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Ionicons from 'react-native-vector-icons/Ionicons'
import Fonts from '../common/Fonts'
import Colors from '../common/Colors'
import QuestionList from '../common/QuestionList'
import CommonStyles from '../common/Styles/Styles'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import Feather from 'react-native-vector-icons/Feather'
import { RFValue } from 'react-native-responsive-fontsize'
import HeaderTitle from '../components/HeaderTitle'
import BottomInfoBox from '../components/BottomInfoBox'

import { useDispatch, useSelector } from 'react-redux'
import BottomSheet from 'reanimated-bottom-sheet'
import LoaderModal from '../components/LoaderModal'
import DeviceInfo from 'react-native-device-info'
import { walletCheckIn } from '../store/actions/trustedContacts'
import { setVersion } from '../store/actions/versionHistory'
import { initNewBHRFlow } from '../store/actions/BHR'
import {  setCloudData } from '../store/actions/cloud'
import CloudBackupStatus from '../common/data/enums/CloudBackupStatus'
import ModalContainer from '../components/home/ModalContainer'
import ButtonBlue from '../components/ButtonBlue'
import { updateCloudPermission } from '../store/actions/BHR'
import CloudPermissionModalContents from '../components/CloudPermissionModalContents'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import CardWithRadioBtn from '../components/CardWithRadioBtn'
import { setupWallet, walletSetupCompletion } from '../store/actions/setupAndAuth'
import { LevelHealthInterface } from '../bitcoin/utilities/Interface'

export enum BottomSheetKind {
  CLOUD_PERMISSION,
}

export enum BottomSheetState {
  Closed,
  Open,
}

// only admit lowercase letters and digits
const ALLOWED_CHARACTERS_REGEXP = /^[0-9a-z]+$/
let messageIndex = 0
const LOADER_MESSAGE_TIME = 2000
const loaderMessages = [
  {
    heading: 'Test Account',
    text:
      'If you\'re a new user, the best place to start exploring the wallet is the Test Account',
    subText: '',
  },
  {
    heading: 'Free Sats!',
    text: 'Register with Swan Bitcoin to get $10 USD worth of free sats',
    subText: '',
  },
  {
    heading: 'Manage Backup',
    text:
      'Make sure to backup your wallet to secure your sats. The first level of backup is done automatically once you allow it',
    subText: '',
  },
  {
    heading: 'Backup Levels',
    text: 'Hexa has three levels of backup. Upgrade your backup when you want to secure more sats',
    subText: '',
  },
]

const getNextMessage = () => {
  if ( messageIndex == ( loaderMessages.length ) ) messageIndex = 0
  return loaderMessages[ messageIndex++ ]
}

function validateAllowedCharacters( answer: string ): boolean {
  return answer == '' || ALLOWED_CHARACTERS_REGEXP.test( answer )
}

export default function NewWalletQuestion( props: { navigation: { getParam: ( arg0: string ) => any; navigate: ( arg0: string, arg1: { walletName: any } ) => void } } ) {
  const [ message, setMessage ] = useState( 'Bootstrapping Accounts' )
  const [ subTextMessage, setSubTextMessage ] = useState(
    'Hexa has a multi-account model which lets you better manage your bitcoin (sats)',
  )
  // const [ bottomTextMessage, setBottomTextMessage ] = useState(
  //   'Hexa uses the passcode and answer to the security question to encrypt different parts of your wallet',
  // )
  // const subPoints = [
  //   'Setting up multi-accounts',
  //   'Fetching test sats & balances',
  //   'Generating shares for back-up',
  //   'Getting the latest details'
  // ]
  const [ Elevation, setElevation ] = useState( 10 )
  // const [ height, setHeight ] = useState( 72 )
  const [ isLoaderStart, setIsLoaderStart ] = useState( false )
  const [ dropdownBoxOpenClose, setDropdownBoxOpenClose ] = useState( false )
  const [ dropdownBoxList ] = useState( QuestionList )
  const [ dropdownBoxValue, setDropdownBoxValue ] = useState( {
    id: '',
    question: '',
  } )
  const [ answerInputStyle, setAnswerInputStyle ] = useState( styles.inputBox )
  const [ pswdInputStyle, setPswdInputStyle ] = useState( styles.inputBox )
  const [ confirmInputStyle, setConfirmAnswerInputStyle ] = useState(
    styles.inputBox,
  )
  const [ confirmPswdInputStyle, setConfirmPswdInputStyle ] = useState(
    styles.inputBox,
  )
  const [ confirmAnswer, setConfirmAnswer ] = useState( '' )
  const [ confirmPswd, setConfirmPswd ] = useState( '' )
  const [ answer, setAnswer ] = useState( '' )
  const [ answerMasked, setAnswerMasked ] = useState( '' )
  const [ confirmAnswerMasked, setConfirmAnswerMasked ] = useState( '' )
  const [ pswd, setPswd ] = useState( '' )
  const [ pswdMasked, setPswdMasked ] = useState( '' )
  const [ confirmPswdMasked, setConfirmPswdMasked ] = useState( '' )
  const [ hideShowConfirmAnswer, setHideShowConfirmAnswer ] = useState( true )
  const [ hideShowConfirmPswd, setHideShowConfirmPswd ] = useState( true )
  const [ hideShowAnswer, setHdeShowAnswer ] = useState( true )
  const [ hideShowPswd, setHideShowPswd ] = useState( true )
  const [ isSkipClicked, setIsSkipClicked ] = useState( false )

  const dispatch = useDispatch()
  const walletName = props.navigation.getParam( 'walletName' )

  const [ answerError, setAnswerError ] = useState( '' )
  const [ pswdError, setPswdError ] = useState( '' )
  const [ tempAns, setTempAns ] = useState( '' )
  const [ tempPswd, setTempPswd ] = useState( '' )
  const [ isEditable, setIsEditable ] = useState( true )
  const [ isDisabled, setIsDisabled ] = useState( false )
  // const [ loaderBottomSheet ] = useState( React.createRef() )
  const [ loaderModal, setLoaderModal ] = useState( false )
  const [ confirmAnswerTextInput ] = useState( React.createRef() )
  const [ confirmPswdTextInput ] = useState( React.createRef() )
  const [ hint ] = useState( React.createRef() )
  const [ hintText, setHint ] = useState( '' )
  const [ visibleButton, setVisibleButton ] = useState( false )
  const [ showNote, setShowNote ] = useState( true )
  const [ securityQue, showSecurityQue ] = useState( false )
  const [ encryptionPswd, showEncryptionPswd ] = useState( false )
  const [ activeIndex, setActiveIndex ] = useState( 0 )
  const accounts = useSelector( ( state: { accounts: any } ) => state.accounts )
  const cloudBackupStatus = useSelector( ( state ) => state.cloud.cloudBackupStatus )
  const walletSetupCompleted = useSelector( ( state ) => state.setupAndAuth.walletSetupCompleted )
  const cloudPermissionGranted = useSelector( ( state ) => state.bhr.cloudPermissionGranted )
  const levelHealth: LevelHealthInterface[] = useSelector( ( state ) => state.bhr.levelHealth )
  const updateWIStatus: boolean = useSelector( ( state ) => state.bhr.loading.updateWIStatus )
  const [ currentBottomSheetKind, setCurrentBottomSheetKind ]: [BottomSheetKind, any] = useState( null )
  const [ bottomSheetState, setBottomSheetState ]: [BottomSheetState, any] = useState( BottomSheetState.Closed )
  const [ cloud ] = useState( Platform.OS == 'ios' ? 'iCloud' : 'Google Drive' )
  const bottomSheetRef = createRef<BottomSheet>()
  const [ isCloudPermissionRender, setIsCloudPermissionRender ] = useState( false )


  // useEffect( ()=>{
  //   const keyboardDidShowListener = Keyboard.addListener(
  //     'keyboardDidShow',
  //     () => {
  //       if ( Platform.OS === 'android' ) {
  //         setHeight( 85 )
  //       }
  //     }
  //   )
  //   const keyboardDidHideListener = Keyboard.addListener(
  //     'keyboardDidHide',
  //     () => {
  //       setHeight( 72 )
  //       if ( Platform.OS === 'android' ) {
  //         setHeight( 72 )
  //       }
  //     }
  //   )

  //   return () => {
  //     keyboardDidHideListener.remove()
  //     keyboardDidShowListener.remove()
  //   }
  // }, [] )

  useEffect( () => {
    // if( cloudBackupStatus === CloudBackupStatus.COMPLETED || cloudBackupStatus === CloudBackupStatus.FAILED ){
    //   // ( loaderBottomSheet as any ).current.snapTo( 0 )
    //   setLoaderModal( false )
    //   props.navigation.navigate( 'HomeNav', {
    //     walletName,
    //   } )
    // }
    if( walletSetupCompleted ) {
      // ( loaderBottomSheet as any ).current.snapTo( 0 )
      setLoaderModal( false )
      props.navigation.navigate( 'HomeNav', {
        walletName,
      } )
    }
  }, [ walletSetupCompleted, cloudBackupStatus ] )

  const checkCloudLogin = ( security ) =>{
    requestAnimationFrame( () => {
      dispatch( setupWallet( walletName, security ) )
      // dispatch( walletSetupCompletion( security ) )
      dispatch( initNewBHRFlow( true ) )
      dispatch( setVersion( 'Current' ) )

      const current = Date.now()
      AsyncStorage.setItem(
        'SecurityAnsTimestamp',
        JSON.stringify( current ),
      )
      const securityQuestionHistory = {
        created: current,
      }
      AsyncStorage.setItem(
        'securityQuestionHistory',
        JSON.stringify( securityQuestionHistory ),
      )
    } )
  }

  // useEffect( ()=>{
  //   if( levelHealth.length && cloudBackupStatus !== CloudBackupStatus.IN_PROGRESS &&
  //     cloudPermissionGranted === true && !isSkipClicked && updateWIStatus === false ){
  //     dispatch( setCloudData() )
  //   }
  // }, [ cloudPermissionGranted, levelHealth, updateWIStatus, cloudBackupStatus ] )

  const showLoader = () => {
    // ( loaderBottomSheet as any ).current.snapTo( 1 )
    setLoaderModal( true )
    setLoaderMessages()
    setTimeout( () => {
      setElevation( 0 )
    }, 0.2 )
    setTimeout( () => {
      setIsLoaderStart( true )
      setIsEditable( false )
      setIsDisabled( true )
    }, 2 )
  }

  const handleSubmit = () => {
    setConfirmAnswer( tempAns )

    if ( answer && confirmAnswer && confirmAnswer != answer ) {
      setAnswerError( 'Answers do not match' )
    } else if (
      validateAllowedCharacters( answer ) == false ||
      validateAllowedCharacters( tempAns ) == false
    ) {
      setAnswerError( 'Answers must only contain lowercase characters (a-z) and digits (0-9)' )
    } else {
      setTimeout( () => {
        setAnswerError( '' )
      }, 2 )
    }
  }

  const handlePswdSubmit = () => {
    setConfirmPswd( tempPswd )

    if ( pswd && confirmPswd && confirmPswd != pswd ) {
      setPswdError( 'Password do not match' )
    } else if (
      validateAllowedCharacters( pswd ) == false ||
      validateAllowedCharacters( tempPswd ) == false
    ) {
      setPswdError( 'Password must only contain lowercase characters (a-z) and digits (0-9)' )
    } else {
      // setTimeout( () => {
      //   setPswdError( '' )
      // }, 2 )
    }
  }


  const handleHintSubmit = () => {
    if ( pswd && confirmPswd && confirmPswd != pswd ) {
      setPswdError( 'Password do not match' )
    } else if (
      validateAllowedCharacters( pswd ) == false ||
      validateAllowedCharacters( tempPswd ) == false
    ) {
      setPswdError( 'Password must only contain lowercase characters (a-z) and digits (0-9)' )
    } else {
      setTimeout( () => {
        setPswdError( '' )
      }, 2 )
    }
  }


  useEffect( () => {
    if ( answer.trim() == confirmAnswer.trim() && answer && confirmAnswer && answerError.length == 0 ) {
      setVisibleButton( true )
    } else {
      setVisibleButton( false )

      if ( answer && confirmAnswer && confirmAnswer != answer ) {
        setAnswerError( 'Answers do not match' )
      } else if (
        validateAllowedCharacters( answer ) == false ||
        validateAllowedCharacters( confirmAnswer ) == false
      ) {
        setAnswerError( 'Answers must only contain lowercase characters (a-z) and digits (0-9)' )
      }
    }
  }, [ confirmAnswer ] )

  useEffect( () => {
    if ( pswd.trim() == confirmPswd.trim() && pswd && confirmPswd && pswdError.length == 0 ) {
      setVisibleButton( true )
    } else {
      setVisibleButton( false )

      if ( pswd && confirmPswd && confirmPswd != pswd ) {
        setPswdError( 'Password do not match' )
      } else if (
        validateAllowedCharacters( pswd ) == false ||
        validateAllowedCharacters( confirmPswd ) == false
      ) {
        setPswdError( 'Password must only contain lowercase characters (a-z) and digits (0-9)' )
      }
    }
  }, [ confirmPswd ] )

  const onPressProceed = ( isSkip? ) => {
    showLoader()
    let security = null
    if ( activeIndex === 0 ) {
      security = {
        questionId: dropdownBoxValue.id,
        question: dropdownBoxValue.question,
        answer,
      }
    } else {
      security = {
        questionId: 0,
        question: hintText,
        answer: pswd,
      }
    }
    if( isSkip ) security = null
    checkCloudLogin( security )
    showSecurityQue( false )
    showEncryptionPswd( false )
  }

  const setButtonVisible = () => {
    return (
      <TouchableOpacity
        onPress={()=>onPressProceed()}
        style={{
          ...styles.buttonView, elevation: Elevation
        }}
      >
        {/* {!loading.initializing ? ( */}
        <Text style={styles.buttonText}>Proceed</Text>
        {/* ) : (
          <ActivityIndicator size="small" />
        )} */}
      </TouchableOpacity>
    )
  }

  const setLoaderMessages = () => {
    setTimeout( () => {
      const newMessage = getNextMessage()
      setMessage( newMessage.heading )
      setSubTextMessage( newMessage.text )
      setTimeout( () => {
        const newMessage = getNextMessage()
        setMessage( newMessage.heading )
        setSubTextMessage( newMessage.text )
        setTimeout( () => {
          const newMessage = getNextMessage()
          setMessage( newMessage.heading )
          setSubTextMessage( newMessage.text )
          setTimeout( () => {
            const newMessage = getNextMessage()
            setMessage( newMessage.heading )
            setSubTextMessage( newMessage.text )
            setTimeout( () => {
              const newMessage = getNextMessage()
              setMessage( newMessage.heading )
              setSubTextMessage( newMessage.text )
              setTimeout( () => {
                const newMessage = getNextMessage()
                setMessage( newMessage.heading )
                setSubTextMessage( newMessage.text )
              }, LOADER_MESSAGE_TIME )
            }, LOADER_MESSAGE_TIME )
          }, LOADER_MESSAGE_TIME )
        }, LOADER_MESSAGE_TIME )
      }, LOADER_MESSAGE_TIME )
    }, LOADER_MESSAGE_TIME )
  }

  const renderLoaderModalContent = useCallback( () => {
    return <LoaderModal headerText={message} messageText={subTextMessage} />
  }, [ message, subTextMessage ] )

  const renderLoaderModalHeader = () => {
    return (
      <View
        style={{
          marginTop: 'auto',
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          height: hp( '75%' ),
          zIndex: 9999,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />
    )
  }

  const confirmAction = () => {
    dispatch( updateCloudPermission( true ) )
    if ( activeIndex === 0 ) {
      showSecurityQue( true )
      setAnswer( '' )
      setConfirmAnswer( '' )
    } else {
      showEncryptionPswd( true )
      setTempPswd( '' )
      setConfirmPswdMasked( '' )
      setPswd( '' )
      setPswdMasked( '' )
    }
  }

  const renderEncryptionPswd = () => {
    return(
      <KeyboardAwareScrollView
        resetScrollToCoords={{
          x: 0, y: 0
        }}
        scrollEnabled={false}
        // style={styles.rootContainer}
        style={{
          backgroundColor: Colors.backgroundColor,
        }}
      >
        <View style={{
          height: hp( '72%' )
        }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {showSecurityQue( false ); showEncryptionPswd( false ); setPswdError( '' ); setHint( '' )}}
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
          <Text style={{
            // marginBottom: wp( '%' ),
            color: Colors.blue,
            fontSize: RFValue( 18 ),
            fontFamily: Fonts.FiraSansRegular,
            marginLeft: wp( '6%' )
          }} >Use your own{'\n'}encryption password</Text>
          <View
            style={{
              ...answerInputStyle,
              flexDirection: 'row',
              alignItems: 'center',
              paddingRight: 15,
              borderColor: pswdError ? Colors.red : Colors.backgroundColor1,
              marginTop: 10,
              backgroundColor: Colors.white
            }}
          >
            <TextInput
              style={styles.modalInputBox}
              placeholder={'Enter your password'}
              placeholderTextColor={Colors.borderColor}
              value={hideShowPswd ? pswdMasked : pswd}
              autoCompleteType="off"
              textContentType="none"
              returnKeyType="next"
              autoCorrect={false}
              editable={isEditable}
              autoCapitalize="none"
              onSubmitEditing={() =>
                ( confirmPswdTextInput as any ).current.focus()
              }
              keyboardType={
                Platform.OS == 'ios'
                  ? 'ascii-capable'
                  : 'visible-password'
              }
              onChangeText={( text ) => {
                setPswd( text.toLowerCase() )
                setPswdMasked( text )
                // setPswdError( '' )
              }}
              onFocus={() => {
                setShowNote( false )
                setDropdownBoxOpenClose( false )
                setPswdInputStyle( styles.inputBoxFocused )
                if ( pswd.length > 0 ) {
                  setPswd( '' )
                  setPswdMasked( '' )
                  setPswdError( '' )
                }
              }}
              onBlur={() => {
                setShowNote( true )
                setPswdInputStyle( styles.inputBox )
                setDropdownBoxOpenClose( false )
                let temp = ''
                for ( let i = 0; i < pswd.length; i++ ) {
                  temp += '*'
                }
                setPswdMasked( temp )
                handlePswdSubmit()
              }}
            />
            {pswd ? (
              <TouchableWithoutFeedback
                onPress={() => {
                  setHideShowPswd( !hideShowPswd )
                }}
              >
                <Feather
                  style={{
                    marginLeft: 'auto', padding: 10
                  }}
                  size={15}
                  color={Colors.blue}
                  name={hideShowPswd ? 'eye-off' : 'eye'}
                />
              </TouchableWithoutFeedback>
            ) : null}
          </View>
          <View
            style={{
              ...answerInputStyle,
              flexDirection: 'row',
              alignItems: 'center',
              paddingRight: 15,
              borderColor: pswdError ? Colors.red : Colors.borderColor,
              marginTop: 10,
              backgroundColor: Colors.white
            }}
          >
            <TextInput
              style={styles.modalInputBox}
              ref={confirmPswdTextInput}
              placeholder={'Confirm your password'}
              placeholderTextColor={Colors.borderColor}
              value={hideShowConfirmPswd ? confirmPswdMasked : tempPswd}
              autoCompleteType="off"
              textContentType="none"
              returnKeyType="next"
              autoCorrect={false}
              editable={isEditable}
              autoCapitalize="none"
              onSubmitEditing={() => {
                handlePswdSubmit();
                ( hint as any ).current.focus()
              }}
              keyboardType={
                Platform.OS == 'ios'
                  ? 'ascii-capable'
                  : 'visible-password'
              }
              onChangeText={( text ) => {
                setTempPswd( text )
                setConfirmPswdMasked( text )
                // setPswdError( '' )
              }}
              onFocus={() => {
                setShowNote( false )
                setDropdownBoxOpenClose( false )
                setConfirmPswdInputStyle( styles.inputBoxFocused )
                if ( tempPswd.length > 0 ) {
                  // setTempPswd( '' )
                  // setPswdMasked( '' )
                  setTempPswd( '' )
                  setPswdError( '' )
                  setConfirmPswd( '' )
                  setConfirmPswdMasked( '' )
                }
              }}
              onBlur={() => {
                setShowNote( true )
                setConfirmPswdInputStyle( styles.inputBox )
                setDropdownBoxOpenClose( false )
                let temp = ''
                for ( let i = 0; i < tempPswd.length; i++ ) {
                  temp += '*'
                }
                setConfirmPswdMasked( temp )
                handlePswdSubmit()
              }}
            />
            {tempPswd ? (
              <TouchableWithoutFeedback
                onPress={() => {
                  setHideShowConfirmPswd( !hideShowConfirmPswd )
                  setDropdownBoxOpenClose( false )
                }}
              >
                <Feather
                  style={{
                    marginLeft: 'auto', padding: 10
                  }}
                  size={15}
                  color={Colors.blue}
                  name={hideShowConfirmPswd ? 'eye-off' : 'eye'}
                />
              </TouchableWithoutFeedback>
            ) : null}
          </View>
          {pswdError.length == 0 && (
            <Text style={styles.helpText}>
              {/* Password must only contain lowercase characters (a-z) and digits (0-9) */}
              Numbers or special characters are not supported
            </Text>
          )}
          <View
            style={{
              ...answerInputStyle,
              flexDirection: 'row',
              alignItems: 'center',
              paddingRight: 15,
              borderColor: Colors.backgroundColor1,
              marginVertical: 10,
              backgroundColor: Colors.white
            }}
          >
            <TextInput
              style={styles.modalInputBox}
              ref={hint}
              placeholder={'Add a hint'}
              placeholderTextColor={Colors.borderColor}
              value={hintText}
              autoCompleteType="off"
              textContentType="none"
              returnKeyType="next"
              autoCorrect={false}
              editable={isEditable}
              autoCapitalize="none"
              keyboardType={
                Platform.OS == 'ios'
                  ? 'ascii-capable'
                  : 'visible-password'
              }
              onChangeText={( text ) => {
                setHint( text )
              }}
              onFocus={() => setShowNote( false )}
              onBlur={() => setShowNote( true )}
            />
            {/* {hintText ? (
              <TouchableWithoutFeedback
                onPress={() => {
                  setHideShowHint( !hideShowHint )

                  // setDropdownBoxOpenClose( false )
                }}
              >
                <Feather
                  style={{
                    marginLeft: 'auto', padding: 10
                  }}
                  size={15}
                  color={Colors.blue}
                  name={hideShowHint ? 'eye-off' : 'eye'}
                />
              </TouchableWithoutFeedback>
            ) : null} */}
          </View>

          <View
            style={{
              marginLeft: 20,
              marginRight: 20,
              flexDirection: 'row',
            }}
          >
            <Text
              style={{
                color: Colors.red,
                fontFamily: Fonts.FiraSansMediumItalic,
                fontSize: RFValue( 10 ),
                marginLeft: 'auto',
              }}
            >
              {pswdError}
            </Text>
          </View>
          {showNote ? <View style={{
            ...styles.bottomButtonView,
          }}>
            {(
              pswd.trim() === confirmPswd.trim() &&
            confirmPswd.trim() &&
            pswd.trim() && pswdError.length === 0 && hintText.length > 0
            ) && (
              setButtonVisible()
            ) || null}
            {/* <View style={styles.statusIndicatorView}>
            <View style={styles.statusIndicatorInactiveView} />
            <View style={styles.statusIndicatorActiveView} />
          </View> */}
          </View> : null}
          {showNote &&
        <View style={{
          marginTop: showNote ? hp( '0%' ) :hp( '2%' ),
          marginBottom: hp( 1 )
        }}>
          {/* {pswd.length === 0 && confirmPswd.length === 0 && */}
          <BottomInfoBox
            title={'Note'}
            infoText={'Make sure you remember the encryption password and keep it safe'}
            italicText={''}
            backgroundColor={Colors.white}
          />
          {/* } */}
        </View>
          }
        </View>
      </KeyboardAwareScrollView>
    )
  }


  const renderSecurityQuestion = () => {
    return (
      <KeyboardAwareScrollView
        resetScrollToCoords={{
          x: 0, y: 0
        }}
        scrollEnabled={false}
        // style={styles.rootContainer}
        style={{
          backgroundColor: Colors.backgroundColor,
          // height: `${height}%`

        }}
      >
        <View style={{
          height: hp( '72%' ),
        }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {showSecurityQue( false ); showEncryptionPswd( false ); setAnswerError( '' )}}
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
          <Text style={{
            // marginBottom: wp( '%' ),
            color: Colors.blue,
            fontSize: RFValue( 18 ),
            fontFamily: Fonts.FiraSansRegular,
            marginLeft: wp( '6%' )
          }} >Answer{'\n'}a Security Question</Text>
          <TouchableOpacity
            activeOpacity={10}
            style={
              dropdownBoxOpenClose
                ? styles.dropdownBoxOpened
                : styles.dropdownBox
            }
            onPress={() => {
              setDropdownBoxOpenClose( !dropdownBoxOpenClose )
            }}
            disabled={isDisabled}
          >
            <Text style={styles.dropdownBoxText}>
              {dropdownBoxValue.question
                ? dropdownBoxValue.question
                : 'Select Question'}
            </Text>
            <Ionicons
              style={{
                marginLeft: 'auto'
              }}
              name={
                dropdownBoxOpenClose ? 'ios-arrow-up' : 'ios-arrow-down'
              }
              size={20}
              color={Colors.textColorGrey}
            />
          </TouchableOpacity>
          {dropdownBoxOpenClose ? (
            <View style={styles.dropdownBoxModal}>
              <ScrollView
                nestedScrollEnabled={true}
                style={{
                  height: hp( '40%' )
                }}
              >
                {dropdownBoxList.map( ( value, index ) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setTimeout( () => {
                        setDropdownBoxValue( value )
                        setDropdownBoxOpenClose( false )
                      }, 70 )
                    }}
                    style={{
                      ...styles.dropdownBoxModalElementView,
                      borderTopLeftRadius: index == 0 ? 10 : 0,
                      borderTopRightRadius: index == 0 ? 10 : 0,
                      borderBottomLeftRadius:
                    index == dropdownBoxList.length - 1 ? 10 : 0,
                      borderBottomRightRadius:
                    index == dropdownBoxList.length - 1 ? 10 : 0,
                      paddingTop: index == 0 ? 5 : 0,
                      backgroundColor: dropdownBoxValue
                        ? dropdownBoxValue.id == value.id
                          ? Colors.lightBlue
                          : Colors.white
                        : Colors.white,
                    }}
                  >
                    <Text
                      style={{
                        color:
                      dropdownBoxValue.id == value.id
                        ? Colors.blue
                        : Colors.black,
                        fontFamily: Fonts.FiraSansRegular,
                        fontSize: RFValue( 12 ),
                      }}
                    >
                      {value.question}
                    </Text>
                  </TouchableOpacity>
                ) )}
              </ScrollView>
            </View>
          ) : null}
          {dropdownBoxValue.id ? (
            <View style={{
              marginTop: 10
            }}>
              <View
                style={{
                  ...answerInputStyle,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingRight: 15,
                  borderColor: answerError ? Colors.red : Colors.backgroundColor1,
                  backgroundColor: Colors.white
                }}
              >
                <TextInput
                  style={styles.modalInputBox}
                  placeholder={'Enter your answer'}
                  placeholderTextColor={Colors.borderColor}
                  value={hideShowAnswer ? answerMasked : answer}
                  autoCompleteType="off"
                  textContentType="none"
                  returnKeyType="next"
                  autoCorrect={false}
                  editable={isEditable}
                  autoCapitalize="none"
                  onSubmitEditing={() =>
                    ( confirmAnswerTextInput as any ).current.focus()
                  }
                  keyboardType={
                    Platform.OS == 'ios'
                      ? 'ascii-capable'
                      : 'visible-password'
                  }
                  onChangeText={( text ) => {
                    setAnswer( text )
                    setAnswerMasked( text )
                  }}
                  onFocus={() => {
                    setShowNote( false )
                    setDropdownBoxOpenClose( false )
                    setAnswerInputStyle( styles.inputBoxFocused )
                    if ( answer.length > 0 ) {
                      setAnswer( '' )
                      setAnswerMasked( '' )
                    }
                  }}
                  onBlur={() => {
                    setShowNote( true )
                    setAnswerInputStyle( styles.inputBox )
                    setDropdownBoxOpenClose( false )
                    let temp = ''
                    for ( let i = 0; i < answer.length; i++ ) {
                      temp += '*'
                    }
                    setAnswerMasked( temp )
                    handleSubmit()
                  }}
                />
                {answer ? (
                  <TouchableWithoutFeedback
                    onPress={() => {
                      setHdeShowAnswer( !hideShowAnswer )
                    }}
                  >
                    <Feather
                      style={{
                        marginLeft: 'auto', padding: 10
                      }}
                      size={15}
                      color={Colors.blue}
                      name={hideShowAnswer ? 'eye-off' : 'eye'}
                    />
                  </TouchableWithoutFeedback>
                ) : null}
              </View>
              <View
                style={{
                  ...confirmInputStyle,
                  marginBottom: 15,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingRight: 15,
                  marginTop: 10,
                  borderColor: answerError ? Colors.red : Colors.backgroundColor1,
                  backgroundColor: Colors.white
                }}
              >
                <TextInput
                  style={styles.modalInputBox}
                  ref={confirmAnswerTextInput}
                  placeholder={'Confirm your answer'}
                  placeholderTextColor={Colors.borderColor}
                  value={
                    hideShowConfirmAnswer ? confirmAnswerMasked : tempAns
                  }
                  keyboardType={
                    Platform.OS == 'ios'
                      ? 'ascii-capable'
                      : 'visible-password'
                  }
                  returnKeyType="done"
                  returnKeyLabel="Done"
                  autoCompleteType="off"
                  autoCorrect={false}
                  editable={isEditable}
                  autoCapitalize="none"
                  onChangeText={( text ) => {
                    setTempAns( text )
                    setConfirmAnswerMasked( text )
                  }}
                  onSubmitEditing={handleSubmit}
                  onFocus={() => {
                    setShowNote( false )
                    setDropdownBoxOpenClose( false )
                    setConfirmAnswerInputStyle( styles.inputBoxFocused )
                    if ( tempAns.length > 0 ) {
                      setTempAns( '' )
                      setAnswerError( '' )
                      setConfirmAnswer( '' )
                      setConfirmAnswerMasked( '' )
                    }
                  }}
                  onBlur={() => {
                    setShowNote( true )
                    setConfirmAnswerInputStyle( styles.inputBox )
                    setDropdownBoxOpenClose( false )
                    let temp = ''
                    for ( let i = 0; i < tempAns.length; i++ ) {
                      temp += '*'
                    }
                    setConfirmAnswerMasked( temp )
                    handleSubmit()
                  }}
                />
                {tempAns ? (
                  <TouchableWithoutFeedback
                    onPress={() => {
                      setHideShowConfirmAnswer( !hideShowConfirmAnswer )
                      setDropdownBoxOpenClose( false )
                    }}
                  >
                    <Feather
                      style={{
                        marginLeft: 'auto', padding: 10
                      }}
                      size={15}
                      color={Colors.blue}
                      name={hideShowConfirmAnswer ? 'eye-off' : 'eye'}
                    />
                  </TouchableWithoutFeedback>
                ) : null}
              </View>

              {answerError.length == 0 && (
                <Text style={styles.helpText}>
              Answers must contain only lower case alphabets and numbers
                </Text>
              )}
            </View>
          ) : (
            <View style={{
              marginTop: 9
            }} />
          )}
          <View
            style={{
              marginLeft: 20,
              marginRight: 20,
              flexDirection: 'row',
            }}
          >
            <Text
              style={{
                color: Colors.red,
                fontFamily: Fonts.FiraSansMediumItalic,
                fontSize: RFValue( 10 ),
                marginLeft: 'auto',
              }}
            >
              {answerError}
            </Text>
          </View>

          {/* <TouchableOpacity
            style={{
              flexDirection: 'row',
              marginLeft: 25,
              marginRight: 25,
              paddingBottom: 10,
              paddingTop: 10,
            }}
            onPress={() =>
              props.navigation.navigate( 'NewOwnQuestions', {
                walletName,
              } )
            }
          >
            <Text
              style={{
                fontFamily: Fonts.FiraSansMediumItalic,
                fontWeight: 'bold',
                fontStyle: 'italic',
                fontSize: RFValue( 12 ),
                color: Colors.blue,
              }}
              onPress={() =>
                props.navigation.navigate( 'NewOwnQuestions', {
                  walletName,
                } )
              }
            >
        Or choose your own question
            </Text>
          </TouchableOpacity> */}

          {showNote ? <View style={{
            ...styles.bottomButtonView,
          }}>
            {(
              answer.trim() === confirmAnswer.trim() &&
            confirmAnswer.trim() &&
            answer.trim() && answerError.length === 0
            ) && (
              setButtonVisible()
            ) || null}
            {/* <View style={styles.statusIndicatorView}>
            <View style={styles.statusIndicatorInactiveView} />
            <View style={styles.statusIndicatorActiveView} />
          </View> */}
          </View> : null}
          {showNote &&
          <View style={{
            marginTop: showNote ? hp( '0%' ) : hp( '2%' ),
            marginBottom: hp( 1 )
          }}>
            {answer.length === 0 && confirmAnswer.length === 0 &&
            <BottomInfoBox
              title={'Note'}
              infoText={'The Answer is used to encrypt the backup. The Security Question acts as a hint to remember'}
              italicText={''}
              backgroundColor={Colors.white}
            />
            }
          </View>
          }
        </View>
      </KeyboardAwareScrollView>
    )
  }

  const openBottomSheet = (
    kind: BottomSheetKind,
    snapIndex: number | null = null
  ) => {
    setBottomSheetState( BottomSheetState.Open )
    setCurrentBottomSheetKind( kind )

    if ( snapIndex == null ) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.snapTo( snapIndex )
    }
  }

  const onBottomSheetClosed =()=> {
    setBottomSheetState( BottomSheetState.Closed )
    setCurrentBottomSheetKind( null )
  }

  const closeBottomSheet = () => {
    setIsCloudPermissionRender( false )
    // bottomSheetRef.current.snapTo( 0 )
    setCurrentBottomSheetKind( null )
    onBottomSheetClosed()
  }

  // const renderBottomSheetContent = () =>{

  //   switch ( currentBottomSheetKind ) {
  //       case BottomSheetKind.CLOUD_PERMISSION:
  //         return (
  //           <CloudPermissionModalContents
  //             title={'Automated Cloud Backup'}
  //             info={'This is the first level of security of your wallet and we encourage you to proceed with this step while setting up the wallet'}
  //             note={''}
  //             onPressProceed={( flag )=>{
  //               dispatch( updateCloudPermission( flag ) )
  //               closeBottomSheet()
  //               console.log( 'updateCloudPermission', flag )
  //               props.navigation.navigate( 'NewWalletQuestion', {
  //                 walletName,
  //               } )
  //             }}
  //             onPressIgnore={( flag )=> {
  //               closeBottomSheet()
  //               console.log( 'updateCloudPermission', flag )
  //               dispatch( updateCloudPermission( flag ) )
  //               props.navigation.navigate( 'NewWalletQuestion', {
  //                 walletName,
  //               } )
  //             }}
  //             isRendered={isCloudPermissionRender}
  //             bottomImage={require( '../assets/images/icons/cloud_ilustration.png' )}
  //           />
  //         )

  //       default:
  //         break
  //   }
  // }

  return (
    <View style={{
      flex: 1,
      backgroundColor: Colors.backgroundColor
    }}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
      <SafeAreaView style={{
        flex: 0
      }} />

      <ScrollView>
        <View style={{
          flex: 1,
          backgroundColor: Colors.backgroundColor
        }}>
          <View style={[ CommonStyles.headerContainer, {
            backgroundColor: Colors.backgroundColor
          } ]}>
            <TouchableOpacity
              style={CommonStyles.headerLeftIconContainer}
              onPress={() => {
                props.navigation.goBack()
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

          <TouchableOpacity
            activeOpacity={10}
            style={{
              flex: 1
            }}
            onPress={() => {
              setDropdownBoxOpenClose( false )
              Keyboard.dismiss()
            }}
            disabled={isDisabled}
          >
            <HeaderTitle
              firstLineTitle={'Step 2\nCreate initial cloud backup'}
              secondLineBoldTitle={'New Wallet '}
              secondLineTitle={'creation'}
              infoTextNormal={''}
              infoTextBold={''}
              infoTextNormal1={''}
              step={''}
            />
            <CardWithRadioBtn
              icon={activeIndex === 0 ? require( '../assets/images/icons/icon_questions.png' ) : require( '../assets/images/icons/question_inactive.png' )}
              mainText={'Answer a Security Question'}
              subText={'Easier to remember. Recommended'}
              isSelected={activeIndex === 0}
              setActiveIndex={setActiveIndex}
              index={0}
            />
            <CardWithRadioBtn
              icon={activeIndex === 1 ? require( '../assets/images/icons/icon_password_active.png' ) : require( '../assets/images/icons/icon_password.png' )}
              mainText={'Use your own encryption password'}
              subText={'Create a password. Make sure to remember it'}
              isSelected={activeIndex === 1}
              setActiveIndex={setActiveIndex}
              index={1}
            />
          </TouchableOpacity>

        </View>
      </ScrollView>

      <View style={styles.statusIndicatorView}>
        <View style={styles.statusIndicatorInactiveView} />
        {/* <View style={styles.statusIndicatorInactiveView} /> */}
        <View style={styles.statusIndicatorActiveView} />
      </View>
      {showNote && !visibleButton ? (
        <View
          style={{
            marginBottom:
                Platform.OS == 'ios' && DeviceInfo.hasNotch ? hp( '1%' ) : 0,
          }}
        >
          <BottomInfoBox
            title={'Note'}
            infoText={'Backup lets you recover your wallet even if you lose your phone. Manage from '}
            italicText={'Security Centre'}
            backgroundColor={Colors.white}
          />
        </View>
      ) : null}
      <View style={{
        alignItems: 'center', marginLeft: wp( '9%' ), marginBottom: hp( '4%' ),
        flexDirection: 'row', marginTop: hp( 2 )
      }}>
        <ButtonBlue
          buttonText="Confirm & Proceed"
          handleButtonPress={confirmAction}
          buttonDisable={false}
        />
        <TouchableOpacity
          onPress={() => {
            console.log( 'asfds' )
            setIsSkipClicked( true )
            dispatch( updateCloudPermission( false ) )
            onPressProceed( true )
          }}
        >
          <Text style={{
            fontSize: RFValue( 13 ),
            color: Colors.blue,
            fontFamily: Fonts.FiraSansMedium,
            alignSelf: 'center',
            marginLeft: wp( '5%' )
          }}>Skip Backup</Text>
        </TouchableOpacity>
      </View>
      {/* <ModalContainer visible={currentBottomSheetKind != null} closeBottomSheet={() => {}} >
        {renderBottomSheetContent()}
      </ModalContainer> */}
      <ModalContainer visible={securityQue} closeBottomSheet={() => {}} >
        {renderSecurityQuestion()}
      </ModalContainer>
      <ModalContainer visible={encryptionPswd} closeBottomSheet={() => {}} >
        {renderEncryptionPswd()}
      </ModalContainer>
      <ModalContainer visible={loaderModal} closeBottomSheet={() => {}} background={'rgba(42,42,42,0.4)'} >
        {renderLoaderModalContent()}
      </ModalContainer>
      {/* <BottomSheet
        onCloseEnd={() => { }}
        enabledGestureInteraction={false}
        enabledInnerScrolling={true}
        ref={loaderBottomSheet}
        snapPoints={[ -50, hp( '100%' ) ]}
        renderContent={renderLoaderModalContent}
        renderHeader={renderLoaderModalHeader}
      /> */}

    </View>
  )
}

const styles = StyleSheet.create( {
  dropdownBox: {
    flexDirection: 'row',
    borderColor: Colors.backgroundColor1,
    borderWidth: 0.5,
    borderRadius: 10,
    marginTop: 15,
    height: 50,
    marginLeft: 20,
    marginRight: 20,
    paddingLeft: 15,
    paddingRight: 15,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  dropdownBoxOpened: {
    flexDirection: 'row',
    borderColor: Colors.backgroundColor1,
    borderWidth: 0.5,
    borderRadius: 10,
    marginTop: 15,
    height: 50,
    marginLeft: 20,
    marginRight: 20,
    paddingLeft: 15,
    paddingRight: 15,
    elevation: 10,
    shadowColor: Colors.borderColor,
    shadowOpacity: 10,
    shadowOffset: {
      width: 2, height: 2
    },
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  buttonView: {
    height: wp( '13%' ),
    width: wp( '35%' ),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: Colors.shadowBlue,
    shadowOpacity: 1,
    shadowOffset: {
      width: 15, height: 15
    },
    backgroundColor: Colors.blue,
  },
  buttonText: {
    color: Colors.white,
    fontSize: RFValue( 13 ),
    fontFamily: Fonts.FiraSansMedium,
  },
  bottomButtonView: {
    flexDirection: 'row',
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: hp( 2 ),
    alignItems: 'center',
  },
  bottomButtonView1: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center',
  },
  statusIndicatorView: {
    flexDirection: 'row',
    marginLeft: 'auto',
    marginHorizontal: wp( '6%' ),
    marginBottom: hp( 2 )
  },
  statusIndicatorActiveView: {
    height: 5,
    width: 25,
    backgroundColor: Colors.blue,
    borderRadius: 10,
    marginLeft: 5,
  },
  statusIndicatorInactiveView: {
    width: 5,
    backgroundColor: Colors.lightBlue,
    borderRadius: 10,
    marginLeft: 5,
  },
  inputBox: {
    borderWidth: 0.5,
    borderRadius: 10,
    marginLeft: 20,
    marginRight: 20,
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
      width: 2, height: 2
    },
    backgroundColor: Colors.white,
  },
  modalInputBox: {
    flex: 1,
    height: 50,
    fontSize: RFValue( 13 ),
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansRegular,
    paddingLeft: 15,

  },
  dropdownBoxText: {
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansRegular,
    fontSize: RFValue( 13 ),
    marginRight: 15,
  },
  dropdownBoxModal: {
    borderRadius: 10,
    margin: 15,
    height: 'auto',
    elevation: 10,
    shadowColor: Colors.shadowBlue,
    shadowOpacity: 10,
    shadowOffset: {
      width: 0, height: 10
    },
    backgroundColor: Colors.white,
  },
  dropdownBoxModalElementView: {
    height: 55,
    justifyContent: 'center',
    paddingLeft: 15,
    paddingRight: 15,
  },

  helpText: {
    fontSize: RFValue( 12 ),
    color: Colors.textColorGrey,
    marginRight: wp( 5 ),
    alignSelf: 'flex-end',
    width: wp( '63%' ),
    textAlign: 'right'
  }
} )
