import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
  AsyncStorage,
  Keyboard,
  TouchableOpacity,
} from 'react-native'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import { useSelector } from 'react-redux'
import Colors from '../../common/Colors'
import {
  ContactRecipientDescribing,
} from '../../common/data/models/interfaces/RecipientDescribing'
import { ListItem } from 'react-native-elements'
import { makeContactRecipientDescription } from '../../utils/sending/RecipientFactories'
import FriendsAndFamilyContactListItemContent from '../../components/friends-and-family/FriendsAndFamilyContactListItemContent'
import { RFValue } from 'react-native-responsive-fontsize'
import ErrorModalContents from '../../components/ErrorModalContents'
import BottomSheet from 'reanimated-bottom-sheet'
import DeviceInfo from 'react-native-device-info'
import ModalHeader from '../../components/ModalHeader'
import HistoryPageComponent from './HistoryPageComponent'
import ShareOtpWithTrustedContact from './ShareOtpWithTrustedContact'
import moment from 'moment'
import _ from 'underscore'
import { generateDeepLink, nameToInitials } from '../../common/CommonFunctions'
import {
  ErrorSending,
  updateMSharesHealth,
  updatedKeeperInfo,
  setChannelAssets,
  createChannelAssets,
  setApprovalStatus,
  createOrChangeGuardian,
  downloadSMShare,
} from '../../store/actions/BHR'
import { useDispatch } from 'react-redux'
import {
  KeeperInfoInterface,
  Keepers,
  LevelHealthInterface,
  MetaShare,
  QRCodeTypes,
  TrustedContact,
  Trusted_Contacts,
  ChannelAssets,
  TrustedContactRelationTypes,
  Wallet,
  DeepLinkEncryptionType
} from '../../bitcoin/utilities/Interface'
import config from '../../bitcoin/HexaConfig'
import SmallHeaderModal from '../../components/SmallHeaderModal'
import FriendsAndFamilyHelpContents from '../../components/Helper/FriendsAndFamilyHelpContents'
import { isEmpty } from '../../common/CommonFunctions/index'
import HistoryHeaderComponent from './HistoryHeaderComponent'
import KeeperTypeModalContents from './KeeperTypeModalContent'
import QRModal from '../Accounts/QRModal'
import { StackActions } from 'react-navigation'
import ApproveSetup from './ApproveSetup'
import semver from 'semver'
import RequestKeyFromContact from '../../components/RequestKeyFromContact'
import ModalContainer from '../../components/home/ModalContainer'
import { getTime } from '../../common/CommonFunctions/timeFormatter'
import { historyArray } from '../../common/CommonVars/commonVars'
import { getIndex } from '../../common/utilities'
import { AppBottomSheetTouchableWrapper } from '../../components/AppBottomSheetTouchableWrapper'
import Fonts from '../../common/Fonts'
import BackupStyles from './Styles'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import BHROperations from '../../bitcoin/utilities/BHROperations'
import dbManager from '../../storage/realm/dbManager'
import idx from 'idx'
import Toast from '../../components/Toast'
import TrustedContactsOperations from '../../bitcoin/utilities/TrustedContactsOperations'

const TrustedContactHistoryKeeper = ( props ) => {
  const [ encryptLinkWith, setEncryptLinkWith ] = useState( DeepLinkEncryptionType.DEFAULT )
  const [ ChangeBottomSheet, setChangeBottomSheet ] = useState( React.createRef() )
  const [ QrBottomSheet ] = useState( React.createRef<BottomSheet>() )
  const [ approvePrimaryKeeperModal, setApprovePrimaryKeeperModal ] = useState( false )
  const [ qrModal, setQRModal ] = useState( false )
  const [ keeperTypeModal, setKeeperTypeModal ] = useState( false )
  const [ HelpModal, setHelpModal ] = useState( false )
  const [ ErrorModal, setErrorModal ] = useState( false )
  const [ ConfirmModal, setConfirmModal ] = useState( false )
  const [ ChangeModal, setChangeModal ] = useState( false )
  const [ shareOtpWithTrustedContactModal, setShareOtpWithTrustedContactModal ] = useState( false )

  const [ oldChannelKey, setOldChannelKey ] = useState( props.navigation.getParam( 'selectedKeeper' ).channelKey ? props.navigation.getParam( 'selectedKeeper' ).channelKey : '' )
  const [ channelKey, setChannelKey ] = useState( props.navigation.getParam( 'selectedKeeper' ).channelKey ? props.navigation.getParam( 'selectedKeeper' ).channelKey : '' )
  const [ changeContact, setChangeContact ] = useState( false )
  const [ QrBottomSheetsFlag, setQrBottomSheetsFlag ] = useState( false )
  const [ errorMessage, setErrorMessage ] = useState( '' )
  const [ errorMessageHeader, setErrorMessageHeader ] = useState( '' )
  const [ reshareModal, setReshareModal ] = useState( false )
  const [ isChangeClicked, setIsChangeClicked ] = useState( false )
  const [ ReshareBottomSheet, setReshareBottomSheet ] = useState(
    React.createRef(),
  )
  const [ ConfirmBottomSheet, setConfirmBottomSheet ] = useState(
    React.createRef(),
  )
  const [ OTP, setOTP ] = useState( '' )
  const [ renderTimer, setRenderTimer ] = useState( false )
  const [ showTrustedContactModal, setTrustedContactModal ] = useState( false )
  const [ LoadContacts, setLoadContacts ] = useState( false )
  const [ isOTPType, setIsOTPType ] = useState( false )
  const [ trustedLink, setTrustedLink ] = useState( '' )
  const [ trustedQR, setTrustedQR ] = useState( '' )
  const [ trustedContactHistory, setTrustedContactHistory ] = useState( historyArray )
  const [ selectedKeeperType, setSelectedKeeperType ] = useState( '' )
  const [ selectedKeeperName, setSelectedKeeperName ] = useState( '' )
  const [ isVersionMismatch, setIsVersionMismatch ] = useState( false )
  const [ isGuardianCreationClicked, setIsGuardianCreationClicked ] = useState( false )
  const [ isNavigation, setNavigation ] = useState( false )
  const [ isReshare, setIsReshare ] = useState( props.navigation.getParam( 'isChangeKeeperType' ) ? false : props.navigation.getParam( 'selectedKeeper' ).status === 'notSetup' ? false : true
  )
  const [ selectedTitle, setSelectedTitle ] = useState( props.navigation.getParam( 'selectedTitle' ) )
  const [ selectedLevelId, setSelectedLevelId ] = useState( props.navigation.getParam( 'selectedLevelId' ) )
  const [ selectedKeeper, setSelectedKeeper ] = useState( props.navigation.getParam( 'selectedKeeper' ) )
  const [ isChange, setIsChange ] = useState( props.navigation.getParam( 'isChangeKeeperType' )
    ? props.navigation.getParam( 'isChangeKeeperType' )
    : false )
  const [ chosenContact, setChosenContact ] = useState( props.navigation.getParam( 'isChangeKeeperType' ) ? null :
    props.navigation.state.params.selectedKeeper && props.navigation.state.params.selectedKeeper.data && props.navigation.state.params.selectedKeeper.data.index
      ? props.navigation.state.params.selectedKeeper.data
      : null,
  )
  const [ shareType, setShareType ] = useState( props.navigation.getParam( 'selectedKeeper' ).shareType )
  const [ showQrCode, setShowQrCode ] = useState( false )
  const [ showFNFList, setShowFNFList ] = useState( false )

  const createChannelAssetsStatus = useSelector( ( state ) => state.bhr.loading.createChannelAssetsStatus )
  const isErrorSendingFailed = useSelector( ( state ) => state.bhr.errorSending )
  const channelAssets: ChannelAssets = useSelector( ( state ) => state.bhr.channelAssets )
  const approvalStatus = useSelector( ( state ) => state.bhr.approvalStatus )
  const s3 = dbManager.getBHR()
  const MetaShares: MetaShare[] = [ ...s3.metaSharesKeeper ]
  const keeperInfo = useSelector( ( state ) => state.bhr.keeperInfo )
  const levelHealth: LevelHealthInterface[] = useSelector( ( state ) => state.bhr.levelHealth )
  const currentLevel = useSelector( ( state ) => state.bhr.currentLevel )
  const trustedContacts: Trusted_Contacts = useSelector( ( state ) => state.trustedContacts.contacts )
  const [ contacts, setContacts ] = useState( [] )
  const wallet: Wallet = useSelector( ( state ) => state.storage.wallet )
  const index = props.navigation.getParam( 'index' )
  const [ isChangeKeeperAllow, setIsChangeKeeperAllow ] = useState( props.navigation.getParam( 'isChangeKeeperType' ) ? false : props.navigation.getParam( 'isChangeKeeperAllow' ) )
  const dispatch = useDispatch()

  useEffect( () => {
    setSelectedLevelId( props.navigation.getParam( 'selectedLevelId' ) )
    setSelectedKeeper( props.navigation.getParam( 'selectedKeeper' ) )
    setIsReshare( props.navigation.getParam( 'isChangeKeeperType' ) ? false : props.navigation.getParam( 'selectedKeeper' ).status === 'notSetup' ? false : true )
    setIsChange(
      props.navigation.getParam( 'isChangeKeeperType' )
        ? props.navigation.getParam( 'isChangeKeeperType' )
        : false
    )
    setOldChannelKey( props.navigation.getParam( 'selectedKeeper' ).channelKey ? props.navigation.getParam( 'selectedKeeper' ).channelKey : '' )
    setShareType( props.navigation.getParam( 'selectedKeeper' ).shareType ? props.navigation.getParam( 'selectedKeeper' ).shareType : 'contact' )
  }, [ props.navigation.state.params ] )

  useEffect( () => {
    if ( isChange ) {
      setTimeout( () => {
        setLoadContacts( true )
      }, 2 )
      // setTrustedContactModal( true )
      if( shareType === 'existingContact' ){
        props.navigation.navigate( 'FNFToKeeper', {
          ...props.navigation.state.params,
          selectContact:selectContact
        } )
        setShowQrCode( true )
      }
      else {
        props.navigation.navigate( 'TrustedContactNewBHR', {
          LoadContacts: true,
          onPressContinue:async ( selectedContacts ) => {
            Keyboard.dismiss()
            createGuardian( {
              chosenContactTmp: getContacts( selectedContacts )
            } )
            setShowQrCode( true )
            // props.navigation.navigate( 'AddContactSendRequest', {
            //   SelectedContact: [ selectedContacts ],
            //   headerText:`Send Recovery Key${'\n'}to contact`,
            //   subHeaderText:'Send Key to Keeper, you can change your Keeper, or their primary mode of contact',
            //   contactText:'Sharing Recovery Key with:',
            //   isKeeper: true,
            //   existingContact: selectedKeeper.shareType == 'existingContact' ? true : false,
            // } )
          }
        } )
      }
    }
  }, [ isChange ] )

  useEffect( () => {
    ( async () => {
      const contacts: Trusted_Contacts = trustedContacts
      const existingContactsArr = []
      for( const channelKey of Object.keys( contacts ) ){
        const contact = contacts[ channelKey ]
        if( contact.relationType === TrustedContactRelationTypes.CONTACT || contact.relationType === TrustedContactRelationTypes.WARD ) {
          existingContactsArr.push( {
            ...contact, channelKey
          } )
        }
      }
      setContacts( existingContactsArr )
      if( props.navigation.getParam( 'selectedKeeper' ).status === 'notSetup' ) {
        setTimeout( () => {
          setLoadContacts( true )
        }, 2 )
        // setTrustedContactModal( true )
        if( existingContactsArr.length ){
          props.navigation.navigate( 'FNFToKeeper', {
            ...props.navigation.state.params,
            selectContact:selectContact
          } ) }
        else {
          props.navigation.navigate( 'TrustedContactNewBHR', {
            LoadContacts: true,
            onPressContinue:async ( selectedContacts ) => {
              Keyboard.dismiss()
              createGuardian( {
                chosenContactTmp: getContacts( selectedContacts )
              } )
              setShowQrCode( true )
              // props.navigation.navigate( 'AddContactSendRequest', {
              //   SelectedContact: [ selectedContacts ],
              //   headerText:`Send Recovery Key${'\n'}to contact`,
              //   subHeaderText:'Send Key to Keeper, you can change your Keeper, or their primary mode of contact',
              //   contactText:'Sharing Recovery Key with:',
              //   isKeeper: true,
              //   existingContact: selectedKeeper.shareType == 'existingContact' ? true : false,
              // } )
            }
          } )
        }

      }
      const shareHistory = JSON.parse( await AsyncStorage.getItem( 'shareHistory' ) )
      if ( shareHistory ) updateHistory( shareHistory )
    } )()
    const trustedContactsInfo: Keepers = trustedContacts
    const contactName = props.navigation.getParam( 'selectedKeeper' ).name.toLowerCase().trim()
    const trustedData = trustedContactsInfo[ contactName ]

    if( trustedData && trustedData.trustedChannel && trustedData.trustedChannel.data.length == 2 ){
      if( trustedData.trustedChannel.data[ 1 ] && semver.lt( trustedData.trustedChannel.data[ 1 ].data.version, '1.6.0' ) ) {
        setTimeout( () => {
          setErrorMessageHeader( 'Error sending Recovery Key' )
          setErrorMessage(
            'your keeper need to update app / come online',
          )
          setIsVersionMismatch( true )
        }, 2 )
        setErrorModal( true )
      }
    }
  }, [] )

  const getContacts = useCallback(
    ( selectedContacts ) => {
      if ( selectedContacts[ 0 ] ) {
        setChosenContact( selectedContacts[ 0 ] )
        setSelectedTitle(
          selectedContacts[ 0 ].firstName && selectedContacts[ 0 ].lastName
            ? selectedContacts[ 0 ].firstName + ' ' + selectedContacts[ 0 ].lastName
            : selectedContacts[ 0 ].firstName && !selectedContacts[ 0 ].lastName
              ? selectedContacts[ 0 ].firstName
              : !selectedContacts[ 0 ].firstName && selectedContacts[ 0 ].lastName
                ? selectedContacts[ 0 ].lastName
                : 'Friends and Family',
        )
      }
      return selectedContacts[ 0 ]
    },
    [ chosenContact ],
  )

  const renderContactListItem = useCallback( ( {
    contactDescription,
    index,
  }: {
    contactDescription: any;
    index: number;
    contactsType: string;
  }
  ) => {
    return <TouchableOpacity style={{
      padding : 5
    }} onPress={()=>{
      const obj = {
        name: contactDescription.contactDetails.contactName,
        imageAvailable: contactDescription.contactDetails.imageAvailable ? true : false,
        image: contactDescription.contactDetails.imageAvailable,
        id: contactDescription.contactDetails.id
      }
      setChannelKey( contactDescription.channelKey )
      setChosenContact( obj ); setShowFNFList( false )}}>
      <Text>{contactDescription.contactDetails.contactName}</Text>
    </TouchableOpacity>

  }, [] )

  const updateHistory = useCallback(
    ( shareHistory ) => {
      const updatedTrustedContactHistory = [ ...trustedContactHistory ]
      if ( shareHistory[ index ].createdAt )
        updatedTrustedContactHistory[ 0 ].date = shareHistory[ index ].createdAt
      if ( shareHistory[ index ].inTransit )
        updatedTrustedContactHistory[ 1 ].date = shareHistory[ index ].inTransit

      if ( shareHistory[ index ].accessible )
        updatedTrustedContactHistory[ 2 ].date = shareHistory[ index ].accessible

      if ( shareHistory[ index ].notAccessible )
        updatedTrustedContactHistory[ 3 ].date =
          shareHistory[ index ].notAccessible
      setTrustedContactHistory( updatedTrustedContactHistory )
    },
    [ trustedContactHistory ],
  )

  const saveInTransitHistory = useCallback( async () => {
    const shareHistory = JSON.parse( await AsyncStorage.getItem( 'shareHistory' ) )
    if ( shareHistory ) {
      const updatedShareHistory = [ ...shareHistory ]
      updatedShareHistory[ index ] = {
        ...updatedShareHistory[ index ],
        inTransit: Date.now(),
      }
      updateHistory( updatedShareHistory )
      await AsyncStorage.setItem(
        'shareHistory',
        JSON.stringify( updatedShareHistory ),
      )
    }
  }, [ updateHistory ] )

  const onOTPShare = useCallback(
    async ( ) => {
      saveInTransitHistory()
      setIsReshare( true )
    },
    [ saveInTransitHistory, chosenContact ],
  )

  const renderShareOtpWithTrustedContactContent = useCallback( () => {
    return (
      <ShareOtpWithTrustedContact
        renderTimer={renderTimer}
        onPressOk={( index ) => {
          setRenderTimer( false )
          onOTPShare( )
          setOTP( '' )
          props.navigation.goBack()
        }}
        onPressBack={() => setShareOtpWithTrustedContactModal( false ) }
        OTP={OTP}
        index={index}
      />
    )
  }, [ onOTPShare, OTP, renderTimer ] )

  const renderShareOtpWithTrustedContactHeader = useCallback( () => {
    return (
      <ModalHeader
        onPressHeader={() => {
          setShareOtpWithTrustedContactModal( false )
        }}
      />
    )
  }, [] )

  const renderConfirmContent = useCallback( () => {
    return (
      <ErrorModalContents
        modalRef={ConfirmBottomSheet}
        title={'Confirm Recovery Key\nwith Keeper'}
        note={
          'Your Recovery Keys with contacts get confirmed automatically when the contact opens their app.\nSimply remind them to open their Hexa app and login to confirm your Recovery Key'
        }
        proceedButtonText={'Ok, got it'}
        onPressProceed={() => setConfirmModal( false )}
        onPressIgnore={() => setConfirmModal( false )}
        isBottomImage={false}
      />
    )
  }, [] )

  const renderErrorModalContent = useCallback( () => {
    return (
      <ErrorModalContents
        modalRef={ErrorModal}
        title={errorMessageHeader}
        info={errorMessage}
        proceedButtonText={'Try again'}
        onPressProceed={() => {
          setErrorModal( false )
        }}
        isBottomImage={true}
        bottomImage={require( '../../assets/images/icons/errorImage.png' )}
      />
    )
  }, [] )

  if ( isErrorSendingFailed ) {
    setTimeout( () => {
      setErrorMessageHeader( 'Error sending Recovery Key' )
      setErrorMessage(
        'There was an error while sending your Recovery Key, please try again in a little while',
      )
    }, 2 )
    setErrorModal( true )
    dispatch( ErrorSending( null ) )
  }

  const onPressReshare = useCallback( async () => {
    setReshareModal( false )
    createGuardian( {
      chosenContactTmp: getContacts( chosenContact )
    } )
    // setShowQrCode( true )
    // props.navigation.navigate( 'AddContactSendRequest', {
    //   SelectedContact: [ chosenContact ],
    //   headerText:`Send Recovery Key${'\n'}to contact`,
    //   subHeaderText:'Send Key to Keeper, you can change your Keeper, or their primary mode of contact',
    //   contactText:'Sharing Recovery Key with:',
    //   isKeeper: true,
    //   existingContact: selectedKeeper.shareType == 'existingContact' ? true : false,
    // } )
  }, [ selectedTitle, chosenContact, getContacts ] )

  const renderChangeContent = useCallback( () => {
    return (
      <ErrorModalContents
        modalRef={ChangeBottomSheet}
        title={'Change your\nKeeper'}
        info={'Having problems with your Keeper'}
        note={
          'You can change the Keeper you selected to send your Recovery Key'
        }
        proceedButtonText={'Change'}
        cancelButtonText={'Back'}
        isIgnoreButton={true}
        onPressProceed={() => {
          setTimeout( () => {
            setLoadContacts( true )
            setChangeContact( true )
          }, 2 )

          if( shareType === 'existingContact' ){
            props.navigation.navigate( 'FNFToKeeper', {
              ...props.navigation.state.params,
              selectContact: selectContact
            } )
            setShowQrCode( true )
          }
          else {
            props.navigation.navigate( 'TrustedContactNewBHR', {
              LoadContacts: true,
              onPressContinue:async ( selectedContacts ) => {
                Keyboard.dismiss()
                createGuardian( {
                  chosenContactTmp: getContacts( selectedContacts ), isChangeTemp: true
                } )
                setShowQrCode( true )
                // props.navigation.navigate( 'AddContactSendRequest', {
                //   SelectedContact: [ selectedContacts ],
                //   headerText:`Send Recovery Key${'\n'}to contact`,
                //   subHeaderText:'Send Key to Keeper, you can change your Keeper, or their primary mode of contact',
                //   contactText:'Sharing Recovery Key with:',
                //   isKeeper: true,
                //   existingContact: selectedKeeper.shareType == 'existingContact' ? true : false,
                // } )
              }
            } )
          }
          setChangeModal( false )
        }}
        onPressIgnore={() => {
          setChangeModal( false )
        }}
        isBottomImage={false}
      />
    )
  }, [] )

  const sortedHistory = useCallback( ( history ) => {
    const currentHistory = history.filter( ( element ) => {
      if ( element.date ) return element
    } )

    const sortedHistory = _.sortBy( currentHistory, 'date' )
    sortedHistory.forEach( ( element ) => {
      element.date = moment( element.date )
        .utc()
        .local()
        .format( 'DD MMMM YYYY HH:mm' )
    } )

    return sortedHistory
  }, [] )

  const getImageIcon = () => {
    if ( chosenContact && chosenContact.name ) {
      if ( chosenContact.imageAvailable ) {
        return (
          <View style={styles.imageBackground}>
            <Image source={chosenContact.image} style={styles.contactImage} />
          </View>
        )
      } else {
        return (
          <View style={styles.imageBackground}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: RFValue( 16 ),
              }}
            >
              {chosenContact &&
              chosenContact.firstName === 'F&F request' &&
              chosenContact.contactsWalletName !== undefined &&
              chosenContact.contactsWalletName !== ''
                ? nameToInitials( `${chosenContact.contactsWalletName}'s wallet` )
                : chosenContact && chosenContact.name
                  ? nameToInitials(
                    chosenContact &&
                      chosenContact.firstName &&
                      chosenContact.lastName
                      ? chosenContact.firstName + ' ' + chosenContact.lastName
                      : chosenContact.firstName && !chosenContact.lastName
                        ? chosenContact.firstName
                        : !chosenContact.firstName && chosenContact.lastName
                          ? chosenContact.lastName
                          : chosenContact.name ? chosenContact.name : '',
                  )
                  : ''}
            </Text>
          </View>
        )
      }
    }
    return (
      <Image
        style={styles.contactImageAvatar}
        source={require( '../../assets/images/icons/icon_user.png' )}
      />
    )
  }

  const createGuardian = useCallback(
    async ( payload?: {isChangeTemp?: any, chosenContactTmp?: any} ) => {
      const isChangeKeeper = isChange ? isChange : payload && payload.isChangeTemp ? payload.isChangeTemp : false
      const Contact = props.navigation.getParam( 'isChangeKeeperType' ) || isChangeKeeper ? payload.chosenContactTmp : ( chosenContact && !Object.keys( chosenContact ).length ) || chosenContact == null ? payload && payload.chosenContactTmp ? payload.chosenContactTmp : chosenContact : chosenContact
      setChosenContact( Contact )
      if( shareType != 'existingContact' && ( trustedQR || isReshare ) && !isChangeKeeper ) return
      setIsGuardianCreationClicked( true )
      const channelKeyTemp: string = shareType == 'existingContact' ? channelKey : isChangeKeeper ? BHROperations.generateKey( config.CIPHER_SPEC.keyLength ) : selectedKeeper.channelKey ? selectedKeeper.channelKey : BHROperations.generateKey( config.CIPHER_SPEC.keyLength )
      setChannelKey( channelKeyTemp )

      const obj: KeeperInfoInterface = {
        shareId: selectedKeeper.shareId,
        name: Contact && Contact.displayedName ? Contact.displayedName : Contact && Contact.name ? Contact && Contact.name : '',
        type: shareType,
        scheme: MetaShares.find( value=>value.shareId==selectedKeeper.shareId ).meta.scheme,
        currentLevel: currentLevel,
        createdAt: moment( new Date() ).valueOf(),
        sharePosition: MetaShares.findIndex( value=>value.shareId==selectedKeeper.shareId ),
        data: {
          ...Contact, index
        },
        channelKey: channelKeyTemp
      }
      console.log( 'USEEFFECT obj', obj )
      dispatch( updatedKeeperInfo( obj ) )
      dispatch( createChannelAssets( selectedKeeper.shareId ) )
    },
    [ trustedContacts, chosenContact ],
  )

  useEffect( ()=> {
    if( isGuardianCreationClicked && !createChannelAssetsStatus && channelAssets.shareId == selectedKeeper.shareId ) {
      console.log( 'USEEFFECT chosenContact', chosenContact )
      console.log( 'USEEFFECT channelKey', channelKey )
      dispatch( createOrChangeGuardian( {
        channelKey, shareId: selectedKeeper.shareId, contact: chosenContact, index, isChange, oldChannelKey, existingContact: shareType == 'existingContact' ? true : false
      } ) )
    }
  }, [ chosenContact, createChannelAssetsStatus, channelAssets ] )

  // useEffect( () => {
  //   // const focusListener = props.navigation.addListener( 'didFocus', ( params ) => {
  //   //   // getMessageToShow()
  //   //   console.log( 'choosenContact >>>>>>>', params.state.params )
  //   //   if( params.state.params[ 'choosenContact' ] ) {
  //   //     setChosenContact( props.navigation.state.params[ 'choosenContact' ] )
  //   //   }
  //   //   if ( params.state.params[ 'addNewContact' ] ) {
  //   //     props.navigation.navigate( 'TrustedContactNewBHR', {
  //   //       LoadContacts: true,
  //   //       onPressContinue:async ( selectedContacts ) => {
  //   //         Keyboard.dismiss()
  //   //         createGuardian( {
  //   //           chosenContactTmp: getContacts( selectedContacts )
  //   //         } )
  //   //         // setShowQrCode( true )
  //   //         props.navigation.navigate( 'AddContactSendRequest', {
  //   //           SelectedContact: [ selectedContacts ],
  //   //           headerText:`Send Recovery Key${'\n'}to contact`,
  //   //           subHeaderText:'Send Key to Keeper, you can change your Keeper, or their primary mode of contact',
  //   //           contactText:'Sharing Recovery Key with:',
  //   //         } )
  //   //       }
  //   //     } )
  //   //   }
  //   // } )
  //   return () => {
  //     focusListener.remove()
  //   }
  // }, [] )

  useEffect( () => {
    if( shareType == 'existingContact' && !isGuardianCreationClicked && ( ( chosenContact && Object.keys( chosenContact ).length ) || chosenContact != null ) ) {
      createGuardian( )
      // setShowQrCode( true )
      // props.navigation.navigate( 'AddContactSendRequest', {
      //   SelectedContact: [ chosenContact ],
      //   headerText:`Send Recovery Key${'\n'}to contact`,
      //   subHeaderText:'Send Key to Keeper, you can change your Keeper, or their primary mode of contact',
      //   contactText:'Sharing Recovery Key with:',
      //   // showDone:true,
      //   isKeeper: true,
      //   existingContact: selectedKeeper.shareType == 'existingContact' ? true : false,
      // } )
    }
  }, [ chosenContact ] )

  useEffect( () => {
    if( !chosenContact ) return

    const contacts: Trusted_Contacts = trustedContacts
    let currentContact: TrustedContact
    let channelKey: string
    if( contacts )
      for( const ck of Object.keys( contacts ) ){
        if ( contacts[ ck ].contactDetails.id === chosenContact.id ){
          currentContact = contacts[ ck ]
          channelKey = ck
          break
        }
      }
    if ( currentContact ) {
      const { secondaryChannelKey } = currentContact
      const appVersion = DeviceInfo.getVersion()
      // generate deep link & QR for the contact
      let encryption_key: string
      if( currentContact.deepLinkConfig ){
        const { encryptionType, encryptionKey } = currentContact.deepLinkConfig
        if( encryptLinkWith === encryptionType ) encryption_key = encryptionKey
      }

      if( !encryption_key )
        switch( encryptLinkWith ){
            case DeepLinkEncryptionType.NUMBER:
              const phoneNumber = idx( chosenContact, ( _ ) => _.phoneNumbers[ 0 ].number )

              if( phoneNumber ){
                const number = phoneNumber.replace( /[^0-9]/g, '' ) // removing non-numeric characters
                encryption_key = number.slice( number.length - 10 ) // last 10 digits only
              } else { Toast( 'F&F contact number missing' ); return }
              break

            case DeepLinkEncryptionType.EMAIL:
              const email = idx( chosenContact, ( _ ) => _.emails[ 0 ].email )
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
      console.log( 'QR currentContact', currentContact )
      const { deepLink, encryptedChannelKeys, encryptionType, encryptionHint } = generateDeepLink( encryptLinkWith, encryption_key, currentContact, wallet.walletName )
      setTrustedLink( deepLink )
      const QRData = JSON.stringify( {
        type: shareType == 'existingContact' ? QRCodeTypes.EXISTING_CONTACT : QRCodeTypes.KEEPER_REQUEST,
        encryptedChannelKeys: encryptedChannelKeys,
        encryptionType,
        encryptionHint,
        walletName: wallet.walletName,
        version: appVersion,
      } )
      setTrustedQR( QRData )
      console.log( 'QR DATA', QRData )
      if( showQrCode ){
        props.navigation.navigate( 'QrAndLink', {
          otp: encryptionHint,
          trustedLink: deepLink,
          trustedQr: QRData,
        } )
      }
      if( isGuardianCreationClicked ) {
        const shareObj = {
          walletId: MetaShares.find( value=>value.shareId==selectedKeeper.shareId ).meta.walletId,
          shareId: selectedKeeper.shareId,
          reshareVersion: MetaShares.find( value=>value.shareId==selectedKeeper.shareId ).meta.reshareVersion,
          shareType: shareType,
          status: 'notAccessible',
          name: chosenContact && chosenContact.name ? chosenContact.name : ''
        }
        dispatch( updateMSharesHealth( shareObj, isChange ) )
        dispatch( setChannelAssets( {
        } ) )
        saveInTransitHistory()
      }
    }
  }, [ chosenContact, trustedContacts, showQrCode ] )

  const onPressChangeKeeperType = ( type, name ) => {
    const changeIndex = getIndex( levelHealth, type, selectedKeeper, keeperInfo )
    setIsChangeClicked( false )
    if ( type == 'contact' ) {
      setChangeModal( true )
    }
    if ( type == 'device' ) {
      props.navigation.navigate( 'SecondaryDeviceHistoryNewBHR', {
        ...props.navigation.state.params,
        selectedTitle: name,
        isChangeKeeperType: true,
        index: changeIndex
      } )
    }
    if ( type == 'pdf' ) {
      props.navigation.navigate( 'PersonalCopyHistoryNewBHR', {
        ...props.navigation.state.params,
        selectedTitle: name,
        isChangeKeeperType: true,
      } )
    }
  }

  const sendApprovalRequestToPK = ( ) => {
    setQrBottomSheetsFlag( true )
    setQRModal( true )
    setKeeperTypeModal( false )
  }

  const renderQrContent = () => {
    return (
      <QRModal
        isFromKeeperDeviceHistory={false}
        QRModalHeader={'QR scanner'}
        title={'Note'}
        infoText={
          'Please approve this request by scanning the Secondary Key stored with any of the other backups'
        }
        modalRef={QrBottomSheet}
        isOpenedFlag={QrBottomSheetsFlag}
        onQrScan={async( qrScannedData ) => {
          // setApprovePrimaryKeeperModal( true )
          dispatch( setApprovalStatus( false ) )
          dispatch( downloadSMShare( qrScannedData ) )
          setQrBottomSheetsFlag( false )
        }}
        onBackPress={() => {
          setQrBottomSheetsFlag( false )
          setQRModal( false )
        }}
        onPressContinue={async() => {
          const qrScannedData = '{"type":"RECOVERY_REQUEST","walletName":"Sadads","channelId":"189c1ef57ac3bddb906d3b4767572bf806ac975c9d5d2d1bf83d533e0c08f1c0","streamId":"4d2d8092d","secondaryChannelKey":"itwTFQ3AiIQWqfUlAUCuW03h","version":"1.8.0","walletId":"00cc552934e207d722a197bbb3c71330fc765de9647833e28c14447d010d9810"}'
          dispatch( setApprovalStatus( false ) )
          // setApprovePrimaryKeeperModal( true )
          dispatch( downloadSMShare( qrScannedData ) )
          setQrBottomSheetsFlag( false )
        }}
      />
    )
  }

  useEffect( ()=>{
    if( approvalStatus && isChangeClicked ){
      setApprovePrimaryKeeperModal( true )
      setQRModal( false )
    }
  }, [ approvalStatus ] )

  useEffect( ()=>{
    if( isChange && channelAssets.shareId && channelAssets.shareId == selectedKeeper.shareId ){
      dispatch( setApprovalStatus( true ) )
    }
  }, [ channelAssets ] )

  useEffect( () => {
    if ( isNavigation ) {
      props.navigation.navigate( 'TrustedContactNewBHR', {
        LoadContacts: true,
        onPressContinue:async ( selectedContacts ) => {
          Keyboard.dismiss()
          createGuardian( {
            chosenContactTmp: getContacts( selectedContacts )
          } )
          // setShowQrCode( true )
          // props.navigation.navigate( 'AddContactSendRequest', {
          //   SelectedContact: [ selectedContacts ],
          //   headerText:`Send Recovery Key${'\n'}to contact`,
          //   subHeaderText:'Send Key to Keeper, you can change your Keeper, or their primary mode of contact',
          //   contactText:'Sharing Recovery Key with:',
          //   isKeeper: true,
          //   existingContact: selectedKeeper.shareType == 'existingContact' ? true : false,
          // } )
        }
      } )
    }

  }, [ isNavigation ] )

  const selectContact = ( type, choosenContact ) => {
    if ( type === 'AddContact' ) {
      setNavigation( true )
      setShareType( 'contact' )
    } else if ( type === 'ExistingContact' ) {
      setChannelKey( choosenContact.channelKey )
      setChosenContact( choosenContact )
      setShareType( 'existingContact' )
    }
  }

  return (
    <View style={{
      flex: 1, backgroundColor: Colors.backgroundColor
    }}>
      <SafeAreaView
        style={{
          flex: 0, backgroundColor: Colors.backgroundColor
        }}
      />
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
      <HistoryHeaderComponent
        onPressBack={() => props.navigation.goBack()}
        selectedTitle={selectedTitle}
        selectedTime={selectedKeeper.updatedAt
          ? getTime( selectedKeeper.updatedAt )
          : 'never'}
        moreInfo={selectedTitle}
        headerImage={require( '../../assets/images/icons/icon_secondarydevice.png' )}
        imageIcon={getImageIcon}
      />
      <View style={{
        flex: 1
      }}>
        <HistoryPageComponent
          type={'contact'}
          IsReshare={isReshare}
          data={sortedHistory( trustedContactHistory )}
          confirmButtonText={'Share Now'}
          onPressChange={() => {
            setKeeperTypeModal( true )
          }}
          onPressConfirm={() => {
            setTimeout( () => {
              setLoadContacts( true )
              setShowQrCode( true )
            }, 2 )
            // ( trustedContactsBottomSheet as any ).current.snapTo( 1 )
            // setTrustedContactModal( true )
            setNavigation( false )
            if ( contacts.length ) {
              props.navigation.navigate( 'FNFToKeeper', {
                ...props.navigation.state.params,
                selectContact: selectContact
              } )
              setShowQrCode( true )
            }
            else {
              props.navigation.navigate( 'TrustedContactNewBHR', {
                LoadContacts: true,
                onPressContinue:async ( selectedContacts ) => {
                  Keyboard.dismiss()
                  createGuardian( {
                    chosenContactTmp: getContacts( selectedContacts )
                  } )
                  setShowQrCode( true )
                  // props.navigation.navigate( 'AddContactSendRequest', {
                  //   SelectedContact: [ selectedContacts ],
                  //   headerText:`Send Recovery Key${'\n'}to contact`,
                  //   subHeaderText:'Send Key to Keeper, you can change your Keeper, or their primary mode of contact',
                  //   contactText:'Sharing Recovery Key with:',
                  //   isKeeper: true,
                  //   existingContact: selectedKeeper.shareType == 'existingContact' ? true : false,
                  // } )
                }
              } )
            }
          }}
          onPressReshare={() => {
            setReshareModal( true )
          }}
          isVersionMismatch={isVersionMismatch}
          isChangeKeeperAllow={isChangeKeeperAllow}
          reshareButtonText={'Reshare'}
          changeButtonText={'Change'}
        />
      </View>
      <ModalContainer visible={shareOtpWithTrustedContactModal} closeBottomSheet={() => setShareOtpWithTrustedContactModal( false )}>
        {renderShareOtpWithTrustedContactContent()}
      </ModalContainer>
      <ModalContainer visible={ChangeModal} closeBottomSheet={() => setChangeModal( false )}>
        {renderChangeContent()}
      </ModalContainer>
      <ModalContainer visible={reshareModal} closeBottomSheet={() => setReshareModal( false )}>
        <ErrorModalContents
          modalRef={ReshareBottomSheet}
          title={'Reshare with the same contact?'}
          info={'Proceed if you want to reshare the link/ QR with the same contact'}
          note={'For a different contact, please go back and choose ‘Change contact’'}
          proceedButtonText={'Reshare'}
          cancelButtonText={'Back'}
          isIgnoreButton={true}
          onPressProceed={() => {
            setShowQrCode( true )
            onPressReshare()
          }}
          onPressIgnore={() => {
            // ( ReshareBottomSheet as any ).current.snapTo( 0 )
            setReshareModal( false )
          }}
          isBottomImage={false}
        />
      </ModalContainer>
      <ModalContainer visible={ConfirmModal} closeBottomSheet={() => setConfirmModal( false )}>
        {renderConfirmContent()}
      </ModalContainer>
      <ModalContainer visible={ErrorModal} closeBottomSheet={() => setErrorModal( false )}>
        {renderErrorModalContent()}
      </ModalContainer>
      {/* <ModalContainer visible={showQrCode} closeBottomSheet={() => setShowQrCode( false )}>
        <RequestKeyFromContact
          isModal={true}
          headerText={`Send Recovery Key${'\n'}to contact`}
          subHeaderText={'Send Key to Keeper, you can change your Keeper, or their primary mode of contact'}
          contactText={'Sharing Recovery Key with'}
          contact={chosenContact}
          QR={trustedQR}
          link={trustedLink}
          contactEmail={''}
          onPressBack={() => {
            // ( shareBottomSheet as any ).current.snapTo( 0 )
            props.navigation.goBack()
          }}
          onPressDone={() => {
            if( props.navigation.getParam( 'isChangeKeeperType' ) ){
              props.navigation.pop( 2 )
            } else {
              props.navigation.pop( 1 )
            }
            // ( shareBottomSheet as any ).current.snapTo( 0 )
          }}
          onPressShare={() => {
            if ( isOTPType ) {
              setTimeout( () => {
                setRenderTimer( true )
              }, 2 )
              // ( shareBottomSheet as any ).current.snapTo( 0 );
              props.navigation.goBack()
              setShareOtpWithTrustedContactModal( true )
            }
            else {
              // ( shareBottomSheet as any ).current.snapTo( 0 )
              props.navigation.goBack()
              const popAction = StackActions.pop( {
                n: isChange ? 2 : 1
              } )
              props.navigation.dispatch( popAction )
            }
          }}
        />
      </ModalContainer> */}
      <ModalContainer visible={showFNFList} closeBottomSheet={() => setShowFNFList( false )}>
        <View
          style={{
            height: '100%',
            backgroundColor: Colors.white,
            alignSelf: 'center',
            width: '100%',
          }}>
          <View
            style={{
              ...BackupStyles.modalHeaderTitleView,
              paddingTop: hp( '0.5%' ),
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 20,
            }}
          >
            <AppBottomSheetTouchableWrapper
              onPress={() => setShowFNFList( false )}
              style={{
                height: 30,
                width: 30,
                justifyContent: 'center'
              }}
            >
              <FontAwesome name="long-arrow-left" color={Colors.blue} size={17} />
            </AppBottomSheetTouchableWrapper>
            <Text style={BackupStyles.modalHeaderTitleText}>
              Associate a contact
            </Text>
            <AppBottomSheetTouchableWrapper
              onPress={()=> {}}
              style={{
                height: wp( '13%' ),
                width: wp( '35%' ),
                justifyContent: 'center',
                alignItems: 'flex-end',
              }}
            >
            </AppBottomSheetTouchableWrapper>
          </View>
          {( contacts.length && contacts.map( ( item, index ) => {
            return renderContactListItem( {
              contactDescription: item,
              index,
              contactsType: 'My Keepers',
            } )
          } ) ) || <View style={{
            height: wp( '22%' ) + 30
          }} />}
        </View>
      </ModalContainer>

      <ModalContainer visible={HelpModal} closeBottomSheet={() => {setHelpModal( false )}} >
        <FriendsAndFamilyHelpContents
          titleClicked={() => setHelpModal( false )}
        />
      </ModalContainer>
      <ModalContainer visible={keeperTypeModal} closeBottomSheet={() => {setKeeperTypeModal( false )}} >
        <KeeperTypeModalContents
          headerText={'Change backup method'}
          subHeader={'Share your Recovery Key with a new contact or a different device'}
          onPressSetup={async ( type, name ) => {
            setSelectedKeeperType( type )
            setSelectedKeeperName( name )
            sendApprovalRequestToPK( )
            setIsChangeClicked( true )
          }}
          onPressBack={() => setKeeperTypeModal( false )}
          selectedLevelId={selectedLevelId}
          keeper={selectedKeeper}
        />
      </ModalContainer>
      <ModalContainer visible={approvePrimaryKeeperModal} closeBottomSheet={()=>{setApprovePrimaryKeeperModal( false )}} >
        {<ApproveSetup
          isContinueDisabled={false}
          onPressContinue={() => {
            onPressChangeKeeperType( selectedKeeperType, selectedKeeperName )
            setApprovePrimaryKeeperModal( false )
          }}
        />}
      </ModalContainer>
      <ModalContainer visible={qrModal} closeBottomSheet={() => {setQRModal( false )}} >
        {renderQrContent()}
      </ModalContainer>
    </View>
  )
}

export default TrustedContactHistoryKeeper

const styles = StyleSheet.create( {
  imageBackground: {
    backgroundColor: Colors.shadowBlue,
    height: wp( '15%' ),
    width: wp( '15%' ),
    borderRadius: wp( '15%' ) / 2,
    borderColor: Colors.white,
    borderWidth: 2.5,
    shadowColor: Colors.textColorGrey,
    shadowOpacity: 0.5,
    shadowOffset: {
      width: 0, height: 3
    },
    shadowRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp( '4%' ),
  },
  contactImageAvatar: {
    width: wp( '15%' ),
    height: wp( '15%' ),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginRight: 8,
    shadowColor: Colors.textColorGrey,
    shadowOpacity: 0.5,
    shadowOffset: {
      width: 0, height: 3
    },
    shadowRadius: 5,
  },
  contactImage: {
    height: wp( '14%' ),
    width: wp( '14%' ),
    resizeMode: 'cover',
    alignSelf: 'center',
    borderRadius: wp( '14%' ) / 2,
  },
} )
