import React, { createRef, PureComponent } from 'react'
import {
  StyleSheet,
  StatusBar,
  View,
  Platform,
  Linking,
  Alert,
  AppState,
} from 'react-native'
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen'
import DeviceInfo from 'react-native-device-info'
import CustodianRequestRejectedModalContents from '../../components/CustodianRequestRejectedModalContents'
import * as RNLocalize from 'react-native-localize'
import Colors from '../../common/Colors'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import {
  REGULAR_ACCOUNT,
  SECURE_ACCOUNT,
} from '../../common/constants/wallet-service-types'
import {
  initializeHealthSetup,
  updateCloudPermission,
  acceptExistingContactRequest
} from '../../store/actions/BHR'
import { connect } from 'react-redux'
import {
  initializeTrustedContact,
  rejectTrustedContact,
  syncPermanentChannels,
  PermanentChannelsSyncKind,
  InitTrustedContactFlowKind
} from '../../store/actions/trustedContacts'
import {
  updateFCMTokens,
  notificationsUpdated,
  setupNotificationList,
  updateNotificationList,
  updateMessageStatusInApp,
  updateMessageStatus,
  getMessages,
} from '../../store/actions/notifications'
import {
  setCurrencyCode,
  setCardData,
  setIsPermissionGiven,
} from '../../store/actions/preferences'
import {
  processDeepLink,
} from '../../common/CommonFunctions/index'
import ErrorModalContents from '../../components/ErrorModalContents'
import Toast from '../../components/Toast'
import PushNotification from 'react-native-push-notification'
import NotificationListContent from '../../components/NotificationListContent'
import AddContactAddressBook from '../Contacts/AddContactAddressBook'
import TrustedContactsService from '../../bitcoin/services/TrustedContactsService'
//import HomeHeader from '../../components/home/home-header'
import idx from 'idx'
import { v4 as uuid } from 'uuid'
import {
  BottomTab,
} from '../../components/home/custom-bottom-tabs'
import {
  addTransferDetails,
  autoSyncShells,
  fetchFeeAndExchangeRates
} from '../../store/actions/accounts'
import {
  AccountType,
  DeepLinkEncryptionType,
  LevelHealthInterface,
  QRCodeTypes,
  Wallet,
} from '../../bitcoin/utilities/Interface'
import moment from 'moment'
import { NavigationActions, StackActions, withNavigationFocus } from 'react-navigation'
import CustodianRequestModalContents from '../../components/CustodianRequestModalContents'
import {
  updatePreference,
  setFCMToken,
  setSecondaryDeviceAddress,
} from '../../store/actions/preferences'
import TrustedContactRequestContent from './TrustedContactRequestContent'
import BottomSheetHeader from '../Accounts/BottomSheetHeader'
import defaultBottomSheetConfigs from '../../common/configs/BottomSheetConfigs'
import BottomSheet from '@gorhom/bottom-sheet'
import { resetToHomeAction } from '../../navigation/actions/NavigationActions'
import { Milliseconds } from '../../common/data/typealiases/UnitAliases'
import { AccountsState } from '../../store/reducers/accounts'
import AccountShell from '../../common/data/models/AccountShell'
import PushNotificationIOS from '@react-native-community/push-notification-ios'
import CloudBackupStatus from '../../common/data/enums/CloudBackupStatus'
import SwanAccountCreationStatus from '../../common/data/enums/SwanAccountCreationStatus'
import messaging from '@react-native-firebase/messaging'
import BuyBitcoinHomeBottomSheet, { BuyBitcoinBottomSheetMenuItem, BuyMenuItemKind } from '../../components/home/BuyBitcoinHomeBottomSheet'
import BottomSheetWyreInfo from '../../components/bottom-sheets/wyre/BottomSheetWyreInfo'
import BottomSheetRampInfo from '../../components/bottom-sheets/ramp/BottomSheetRampInfo'
import BottomSheetSwanInfo from '../../components/bottom-sheets/swan/BottomSheetSwanInfo'
import { setVersion } from '../../store/actions/versionHistory'
import { clearSwanCache, updateSwanStatus, createTempSwanAccountInfo, updateStartRegistration } from '../../store/actions/SwanIntegration'
import { clearRampCache } from '../../store/actions/RampIntegration'
import { clearWyreCache } from '../../store/actions/WyreIntegration'
import { setCloudData } from '../../store/actions/cloud'
import { credsAuthenticated } from '../../store/actions/setupAndAuth'
import { setShowAllAccount } from '../../store/actions/accounts'
import HomeContainer from './HomeContainer'
import Header from '../../navigation/stacks/Header'
import { NotificationType } from '../../components/home/NotificationType'
import NotificationInfoContents from '../../components/NotificationInfoContents'
import ModalContainer from '../../components/home/ModalContainer'
import TrustedContactsOperations from '../../bitcoin/utilities/TrustedContactsOperations'

export const BOTTOM_SHEET_OPENING_ON_LAUNCH_DELAY: Milliseconds = 800
export enum BottomSheetState {
  Closed,
  Open,
}
export enum BottomSheetKind {
  TAB_BAR_BUY_MENU,
  TRUSTED_CONTACT_REQUEST,
  ADD_CONTACT_FROM_ADDRESS_BOOK,
  NOTIFICATIONS_LIST,
  SWAN_STATUS_INFO,
  WYRE_STATUS_INFO,
  RAMP_STATUS_INFO,
  ERROR,
  CLOUD_ERROR,
  NOTIFICATION_INFO,
}

interface HomeStateTypes {
  notificationLoading: boolean;
  notificationData: any[];
  CurrencyCode: string;
  netBalance: number;
  selectedBottomTab: BottomTab | null;

  bottomSheetState: BottomSheetState;
  currentBottomSheetKind: BottomSheetKind | null;

  secondaryDeviceOtp: any;
  currencyCode: string;
  errorMessageHeader: string;
  errorMessage: string;
  selectedContact: any[];
  notificationDataChange: boolean;
  appState: string;
  trustedContactRequest: any;
  recoveryRequest: any;
  custodyRequest: any;
  isLoadContacts: boolean;
  lastActiveTime: string;
  swanDeepLinkContent: string | null;
  isBalanceLoading: boolean;
  addContactModalOpened: boolean;
  wyreDeepLinkContent: string | null;
  rampDeepLinkContent: string | null;
  rampFromBuyMenu: boolean | null;
  rampFromDeepLink: boolean | null;
  wyreFromBuyMenu: boolean | null;
  wyreFromDeepLink: boolean | null;
  notificationTitle: string | null;
  notificationInfo: string | null;
  notificationNote: string | null;
  notificationAdditionalInfo: any;
  notificationProceedText: string | null;
  notificationIgnoreText: string | null;
  isIgnoreButton: boolean;
  currentMessage: any;
}

interface HomePropsTypes {
  navigation: any;
  notificationList: any;
  exchangeRates?: any[];
  initializeTrustedContact: any;
  accountsState: AccountsState;
  cloudPermissionGranted: any;

  wallet: Wallet;
  UNDER_CUSTODY: any;
  updateFCMTokens: any;
  acceptExistingContactRequest: any;
  rejectTrustedContact: any;
  initializeHealthSetup: any;
  overallHealth: any;
  levelHealth: LevelHealthInterface[];
  currentLevel: number;
  keeperInfo: any[];
  autoSyncShells: any;
  clearWyreCache: any;
  clearRampCache: any;
  clearSwanCache: any;
  updateSwanStatus: any;
  fetchFeeAndExchangeRates: any;
  createTempSwanAccountInfo: any;
  addTransferDetails: any;
  trustedContacts: TrustedContactsService;
  isFocused: boolean;
  notificationListNew: any;
  notificationsUpdated: any;
  setCurrencyCode: any;
  currencyCode: any;
  updatePreference: any;
  existingFCMToken: any;
  setFCMToken: any;
  setSecondaryDeviceAddress: any;
  secondaryDeviceAddressValue: any;
  releaseCasesValue: any;
  swanDeepLinkContent: string | null;
  database: any;
  setCardData: any;
  cardDataProps: any;
  secureAccount: any;
  accountShells: AccountShell[];
  setVersion: any;
  wyreDeepLinkContent: string | null;
  rampDeepLinkContent: string | null;
  rampFromBuyMenu: boolean | null;
  rampFromDeepLink: boolean | null;
  wyreFromBuyMenu: boolean | null;
  wyreFromDeepLink: boolean | null;
  setCloudData: any;
  newBHRFlowStarted: any;
  cloudBackupStatus: CloudBackupStatus;
  updateCloudPermission: any;
  credsAuthenticated: any;
  setShowAllAccount: any;
  setIsPermissionGiven: any;
  isPermissionSet: any;
  isAuthenticated: any;
  setupNotificationList: any;
  asyncNotificationList: any;
  updateNotificationList: any;
  fetchStarted: any;
  messages: any;
  updateMessageStatusInApp: any;
  updateMessageStatus: any;
  initLoader: boolean;
  getMessages: any;
  syncPermanentChannels: any;
  updateStartRegistration: any;
}

class Home extends PureComponent<HomePropsTypes, HomeStateTypes> {
  focusListener: any;
  appStateListener: any;
  firebaseNotificationListener: any;
  notificationOpenedListener: any;
  bottomSheetRef = createRef<BottomSheet>();
  openBottomSheetOnLaunchTimeout: null | ReturnType<typeof setTimeout>;
  syncPermanantChannelTime: any
  static whyDidYouRender = true;

  constructor( props ) {
    super( props )
    this.props.setShowAllAccount( false )
    this.focusListener = null
    this.appStateListener = null
    this.openBottomSheetOnLaunchTimeout = null
    this.syncPermanantChannelTime = null
    this.state = {
      notificationData: [],
      CurrencyCode: 'USD',
      netBalance: 0,
      selectedBottomTab: null,
      bottomSheetState: BottomSheetState.Closed,
      currentBottomSheetKind: null,
      secondaryDeviceOtp: {
      },
      currencyCode: 'USD',
      errorMessageHeader: '',
      errorMessage: '',
      selectedContact: [],
      notificationDataChange: false,
      appState: '',
      trustedContactRequest: null,
      recoveryRequest: null,
      custodyRequest: null,
      isLoadContacts: false,
      lastActiveTime: moment().toISOString(),
      notificationLoading: true,
      swanDeepLinkContent: null,
      isBalanceLoading: true,
      addContactModalOpened: false,
      wyreDeepLinkContent: null,
      rampDeepLinkContent: null,
      rampFromBuyMenu: null,
      rampFromDeepLink: null,
      wyreFromBuyMenu: null,
      wyreFromDeepLink: null,
      notificationTitle: null,
      notificationInfo: null,
      notificationNote: null,
      notificationAdditionalInfo: null,
      notificationProceedText: null,
      notificationIgnoreText:null,
      isIgnoreButton: false,
      currentMessage: null,
    }
  }

  handleBuyBitcoinBottomSheetSelection = ( menuItem: BuyBitcoinBottomSheetMenuItem ) => {

    switch ( menuItem.kind ) {
        case BuyMenuItemKind.FAST_BITCOINS:
          this.closeBottomSheet()
          this.props.navigation.navigate( 'VoucherScanner' )
          break
        case BuyMenuItemKind.SWAN:
          const swanAccountActive = false
          if( !swanAccountActive ){
            this.props.clearSwanCache()
            this.props.updateSwanStatus( SwanAccountCreationStatus.BUY_MENU_CLICKED )
          }
          else {
            this.props.updateSwanStatus( SwanAccountCreationStatus.ACCOUNT_CREATED )
          }
          this.setState( {
            swanDeepLinkContent: null
          }, () => {
            this.openBottomSheet( BottomSheetKind.SWAN_STATUS_INFO )
          } )
          break
        case BuyMenuItemKind.RAMP:
          this.props.clearRampCache()
          this.setState( {
            rampDeepLinkContent: null,
            rampFromDeepLink: false,
            rampFromBuyMenu: true
          }, () => {
            this.openBottomSheet( BottomSheetKind.RAMP_STATUS_INFO )
          } )
          break
        case BuyMenuItemKind.WYRE:
          this.props.clearWyreCache()
          this.setState( {
            wyreDeepLinkContent: null,
            wyreFromDeepLink: false,
            wyreFromBuyMenu: true
          }, () => {
            this.openBottomSheet( BottomSheetKind.WYRE_STATUS_INFO )
          } )
          break
    }
  };

  openBottomSheet = (
    kind: BottomSheetKind,
    snapIndex?: number | null,
    swanAccountClicked?: boolean | false
  ) => {
    const tempMenuItem: BuyBitcoinBottomSheetMenuItem = {
      kind: BuyMenuItemKind.SWAN
    }

    if( swanAccountClicked ) this.handleBuyBitcoinBottomSheetSelection( tempMenuItem )

    this.setState(
      {
        bottomSheetState: BottomSheetState.Open,
        currentBottomSheetKind: kind,
      },
      () => {
        if ( snapIndex == null ) {
          this.bottomSheetRef.current?.expand()
        } else {
          this.bottomSheetRef.current?.snapTo( snapIndex )
        }
      }
    )
  };

  onBottomSheetClosed() {
    this.setState( {
      bottomSheetState: BottomSheetState.Closed,
      currentBottomSheetKind: null,
    } )
  }

  closeBottomSheet = () => {
    this.bottomSheetRef.current?.close()
    this.onBottomSheetClosed()
  };

  onBackPress = () => {
    this.openBottomSheet( BottomSheetKind.TAB_BAR_BUY_MENU )
  };


  renderBottomSheetContent() {
    // console.log( 'this.state.currentBottomSheetKind', this.state.currentBottomSheetKind )
    switch ( this.state.currentBottomSheetKind ) {
        case BottomSheetKind.TAB_BAR_BUY_MENU:
          return (
            <>
              <BottomSheetHeader title="Buy bitcoin" onPress={this.closeBottomSheet} />

              <BuyBitcoinHomeBottomSheet
                onMenuItemSelected={this.handleBuyBitcoinBottomSheetSelection}
                // onPress={this.closeBottomSheet}
              />
            </>
          )
        case BottomSheetKind.SWAN_STATUS_INFO:
          return (
            <>
              <BottomSheetHeader title="" onPress={this.closeBottomSheet} />
              <BottomSheetSwanInfo
                swanDeepLinkContent={this.state.swanDeepLinkContent}
                onClickSetting={() => {
                  this.closeBottomSheet()
                  this.props.updateStartRegistration()
                }}
                // onPress={this.closeBottomSheet}
                onPress={this.onBackPress}
              />
            </>
          )
        case BottomSheetKind.WYRE_STATUS_INFO:
          return (
            <>
              <BottomSheetHeader title="" onPress={this.closeBottomSheet} />
              <BottomSheetWyreInfo
                wyreDeepLinkContent={this.state.wyreDeepLinkContent}
                wyreFromBuyMenu={this.state.wyreFromBuyMenu}
                wyreFromDeepLink={this.state.wyreFromDeepLink}
                onClickSetting={() => {
                  this.closeBottomSheet()
                }}
                // onPress={this.closeBottomSheet}
                onPress={this.onBackPress}
              />
            </>
          )

        case BottomSheetKind.RAMP_STATUS_INFO:
          return (
            <>
              <BottomSheetHeader title="" onPress={this.closeBottomSheet} />
              <BottomSheetRampInfo
                rampDeepLinkContent={this.state.rampDeepLinkContent}
                rampFromBuyMenu={this.state.rampFromBuyMenu}
                rampFromDeepLink={this.state.rampFromDeepLink}
                onClickSetting={() => {
                  this.closeBottomSheet()
                }}
                // onPress={this.closeBottomSheet}
                onPress={this.onBackPress}
              />
            </>
          )

        default:
          break
    }
  }

  render() {
    return (
      <View style={{
        backgroundColor: Colors.blue
      }}>
        <StatusBar backgroundColor={Colors.blue} barStyle="light-content" />
        <ModalContainer
          visible={this.state.currentBottomSheetKind !== null}
          closeBottomSheet={() => {}}
        >
          {this.renderBottomSheetContent()}
        </ModalContainer>
        {/* <Header fromScreen={'Home'} /> */}
        {/* <View
          style={{
            flex: 3.8,
            paddingTop:
              Platform.OS == 'ios' && DeviceInfo.hasNotch
                ? heightPercentageToDP( '5%' )
                : 0,
          }}
        >
          <HomeHeader
            onPressNotifications={this.onPressNotifications}
            notificationData={notificationData}
            walletName={wallet.walletName}
            getCurrencyImageByRegion={getCurrencyImageByRegion}
            netBalance={netBalance}
            exchangeRates={exchangeRates}
            CurrencyCode={currencyCode}
            navigation={navigation}
            currentLevel={currentLevel}
            //  onSwitchToggle={this.onSwitchToggle}
            // setCurrencyToggleValue={this.setCurrencyToggleValue}
            // navigation={this.props.navigation}
            // overallHealth={overallHealth}
          />
        </View> */}
        <HomeContainer containerView={styles.accountCardsSectionContainer} openBottomSheet={this.openBottomSheet} swanDeepLinkContent={this.state.swanDeepLinkContent} />

      </View>
    )
  }
}

const mapStateToProps = ( state ) => {
  return {
    notificationList: state.notifications.notifications,
    accountsState: state.accounts,
    cloudPermissionGranted: state.bhr.cloudPermissionGranted,
    exchangeRates: idx( state, ( _ ) => _.accounts.exchangeRates ),
    wallet: idx( state, ( _ ) => _.storage.wallet ),
    UNDER_CUSTODY: idx(
      state,
      ( _ ) => _.storage.database.DECENTRALIZED_BACKUP.UNDER_CUSTODY
    ),
    cardDataProps: idx( state, ( _ ) => _.preferences.cardData ),
    secureAccount: idx( state, ( _ ) => _.accounts[ SECURE_ACCOUNT ].service ),
    overallHealth: idx( state, ( _ ) => _.sss.overallHealth ),
    trustedContacts: idx( state, ( _ ) => _.trustedContacts.service ),
    notificationListNew: idx( state, ( _ ) => _.notifications.notificationListNew ),
    currencyCode: idx( state, ( _ ) => _.preferences.currencyCode ),
    existingFCMToken: idx( state, ( _ ) => _.preferences.existingFCMToken ),
    secondaryDeviceAddressValue: idx(
      state,
      ( _ ) => _.preferences.secondaryDeviceAddressValue
    ),
    releaseCasesValue: idx( state, ( _ ) => _.preferences.releaseCasesValue ),
    database: idx( state, ( _ ) => _.storage.database ) || {
    },
    levelHealth: idx( state, ( _ ) => _.bhr.levelHealth ),
    currentLevel: idx( state, ( _ ) => _.bhr.currentLevel ),
    keeperInfo: idx( state, ( _ ) => _.bhr.keeperInfo ),
    accountShells: idx( state, ( _ ) => _.accounts.accountShells ),
    newBHRFlowStarted: idx( state, ( _ ) => _.bhr.newBHRFlowStarted ),
    cloudBackupStatus: idx( state, ( _ ) => _.cloud.cloudBackupStatus ) || CloudBackupStatus.PENDING,
    isPermissionSet: idx( state, ( _ ) => _.preferences.isPermissionSet ),
    isAuthenticated: idx( state, ( _ ) => _.setupAndAuth.isAuthenticated, ),
    asyncNotificationList: idx( state, ( _ ) => _.notifications.updatedNotificationList ),
    fetchStarted: idx( state, ( _ ) => _.notifications.fetchStarted ),
    messages: state.notifications.messages,
    initLoader: idx( state, ( _ ) => _.bhr.loading.initLoader ),
  }
}

export default withNavigationFocus(
  connect( mapStateToProps, {
    updateFCMTokens,
    initializeTrustedContact,
    acceptExistingContactRequest,
    rejectTrustedContact,
    initializeHealthSetup,
    autoSyncShells,
    clearWyreCache,
    clearRampCache,
    clearSwanCache,
    updateSwanStatus,
    fetchFeeAndExchangeRates,
    createTempSwanAccountInfo,
    addTransferDetails,
    notificationsUpdated,
    setCurrencyCode,
    updatePreference,
    setFCMToken,
    setSecondaryDeviceAddress,
    setCardData,
    setVersion,
    setCloudData,
    updateCloudPermission,
    credsAuthenticated,
    setShowAllAccount,
    setIsPermissionGiven,
    setupNotificationList,
    updateNotificationList,
    updateMessageStatusInApp,
    updateMessageStatus,
    getMessages,
    syncPermanentChannels,
    updateStartRegistration
  } )( Home )
)

const styles = StyleSheet.create( {
  cardContainer: {
    backgroundColor: Colors.white,
    width: widthPercentageToDP( '95%' ),
    // height: heightPercentageToDP( '7%' ),
    // borderColor: Colors.borderColor,
    // borderWidth: 1,
    borderRadius: widthPercentageToDP( 3 ),
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: widthPercentageToDP( 5 ),
    alignSelf: 'center',
    flexDirection: 'row',
    paddingHorizontal: widthPercentageToDP ( 2 )
  },
  accountCardsSectionContainer: {
    height: hp( '70.83%' ),
    // marginTop: 30,
    backgroundColor: Colors.backgroundColor1,
    borderTopLeftRadius: 25,
    shadowColor: 'black',
    shadowOpacity: 0.4,
    shadowOffset: {
      width: 2,
      height: -1,
    },
    flexDirection: 'column',
    justifyContent: 'space-around'
  },

  floatingActionButtonContainer: {
    // position: 'absolute',
    // zIndex: 0,
    // bottom: TAB_BAR_HEIGHT,
    // right: 0,
    // flexDirection: 'row',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    padding: heightPercentageToDP( 1.5 ),
  },

  cloudErrorModalImage: {
    width: wp( '30%' ),
    height: wp( '25%' ),
    marginLeft: 'auto',
    resizeMode: 'stretch',
    marginBottom: hp( '-3%' ),
  }
} )
