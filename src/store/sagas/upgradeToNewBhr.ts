import { call, fork, put, select } from 'redux-saga/effects'
import {
  createWatcher,
} from '../utils/utilities'
import {
  switchUpgradeLoader,
  INIT_LEVELS,
  AUTO_UPLOAD_SECONDARY,
  SET_CLOUD_FOR_LEVEL,
  AUTO_UPLOAD_CONTACT,
  UPDATE_AVAILABLE_KEEPER_DATA,
  setAvailableKeeperData,
  updateAvailableKeeperData,
  isUpgradeLevelInitializedStatus,
  CONFIRM_PDF_SHARED_UPGRADE,
} from '../actions/upgradeToNewBhr'
import { checkMSharesHealth, healthCheckInitialized, isLevel2InitializedStatus, isLevel3InitializedStatus, onApprovalStatusChange, updatedKeeperInfo, updateMSharesHealth } from '../actions/health'
import { generateRandomString } from '../../common/CommonFunctions'
import moment from 'moment'
import S3Service from '../../bitcoin/services/sss/S3Service'
import { insertDBWorker } from './storage'
import { INotification, KeeperInfoInterface, Keepers, LevelHealthInterface, MetaShare, notificationTag, notificationType, TrustedDataElements } from '../../bitcoin/utilities/Interface'
import TrustedContactsService from '../../bitcoin/services/TrustedContactsService'
import RelayServices from '../../bitcoin/services/RelayService'
import { setCloudData } from '../actions/cloud'
import semver from 'semver'
import LevelHealth from '../../bitcoin/utilities/LevelHealth/LevelHealth'

function* initLevelsWorker( { payload } ) {
  try {
    const { level } = payload
    yield put( switchUpgradeLoader( 'initLevels' ) )
    const s3Service: S3Service = yield select( ( state ) => state.health.service )
    const randomIdForSecurityQ = generateRandomString( 8 )
    const SecurityQuestionHealth = {
      shareType: 'securityQuestion',
      updatedAt: moment( new Date() ).valueOf(),
      status: 'accessible',
      shareId: randomIdForSecurityQ,
      reshareVersion: 0,
    }
    console.log( 'SecurityQuestionHealth', SecurityQuestionHealth )
    const res = yield call(
      s3Service.initLevels,
      SecurityQuestionHealth,
      level
    )
    if ( res.data.success ) {
      yield put( healthCheckInitialized() )
      const { SERVICES } = yield select( ( state ) => state.storage.database )
      const updatedSERVICES = {
        ...SERVICES,
        S3_SERVICE: JSON.stringify( s3Service ),
      }
      yield call( insertDBWorker, {
        payload: {
          SERVICES: updatedSERVICES
        }
      } )
      // Update Health to reducer
      yield put( checkMSharesHealth() )
      yield put( isUpgradeLevelInitializedStatus() )
      if ( level == 2 ) yield put( isLevel2InitializedStatus() )
      if ( level == 3 ) {
        yield put( isLevel2InitializedStatus() ); yield put( isLevel3InitializedStatus() )
      }
    }
    yield put( switchUpgradeLoader( 'initLevels' ) )
  } catch ( error ) {
    yield put( switchUpgradeLoader( 'initLevels' ) )
  }
}

export const initLevelsWatcher = createWatcher(
  initLevelsWorker,
  INIT_LEVELS,
)

function* setCloudDataForLevelWorker( { payload } ) {
  try {
    const { level } = payload
    yield put( switchUpgradeLoader( 'cloudDataForLevel' ) )
    const s3Service: S3Service = yield select( ( state ) => state.health.service )
    const metaShares: MetaShare[] = s3Service.levelhealth.metaSharesKeeper
    const levelHealth: LevelHealthInterface[] = yield select( ( state ) => state.health.levelHealth )
    const keeperInfo = yield select( ( state ) => state.health.keeperInfo )
    const currentLevel = yield select( ( state ) => state.health.currentLevel )
    console.log( 'levelHealth', levelHealth )
    console.log( 'level', level )
    let share: MetaShare
    if( level > 0 ){
      share = metaShares.find( value => value.shareId == levelHealth[ level-1 ].levelInfo[ 0 ].shareId )
    }
    yield put( setCloudData(
      keeperInfo,
      currentLevel,
      share
    ) )
    yield put( switchUpgradeLoader( 'cloudDataForLevel' ) )
  } catch ( error ) {
    yield put( switchUpgradeLoader( 'cloudDataForLevel' ) )
  }
}

export const setCloudDataForLevelWatcher = createWatcher(
  setCloudDataForLevelWorker,
  SET_CLOUD_FOR_LEVEL,
)

function* autoShareSecondaryWorker( { payload } ) {
  try {
    yield put( switchUpgradeLoader( 'secondarySetupAutoShare' ) )
    const { shareId } = payload
    const name = 'Secondary Device1'
    const s3Service: S3Service = yield select( ( state ) => state.health.service )
    const obj: KeeperInfoInterface = {
      shareId: shareId,
      name: name,
      type: 'device',
      scheme: s3Service.levelhealth.metaSharesKeeper.find( value => value.shareId == shareId ).meta.scheme,
      currentLevel: this.props.levelToSetup,
      createdAt: moment( new Date() ).valueOf(),
      sharePosition: s3Service.levelhealth.metaSharesKeeper.findIndex( value => value.shareId == shareId ),
      data: {
        name: name, index: 0
      }
    }
    yield put( updatedKeeperInfo( obj ) )
    const walletId = s3Service.getWalletId().data.walletId
    const { WALLET_SETUP, SERVICES } = yield select( ( state ) => state.storage.database )
    const keeperInfo = yield select( ( state ) => state.health.keeperInfo )
    const response = yield call( s3Service.updateKeeperInfoToMetaShare, keeperInfo, WALLET_SETUP.security.answer )
    const metaShares: MetaShare[] = s3Service.levelhealth.metaSharesKeeper
    const secondaryMetaShares: MetaShare[] = s3Service.levelhealth.SMMetaSharesKeeper
    const trustedContacts: TrustedContactsService = yield select( ( state ) => state.trustedContacts.service )
    const share: MetaShare = metaShares.find( value => value.shareId == shareId )
    const trustedContactsInfo: Keepers = trustedContacts.tc.trustedContacts
    const oldKeeperInfo  = trustedContactsInfo[ 'Secondary Device'.toLowerCase() ]
    const status = 'accessible'
    const data: TrustedDataElements = {
      metaShare: share,
      secondaryShare: secondaryMetaShares[ 1 ]
    }
    const ress = yield call( trustedContacts.initTCFromOldTC, 'Secondary Device'.toLowerCase(), name.toLowerCase() )
    console.log( 'autoShareSecondaryWorker trustedContacts', trustedContacts )
    const res = yield call(
      trustedContacts.updateTrustedChannel,
      'Secondary Device',
      data,
      false
    )
    if ( res.status == 200 ) {
      const updatedSERVICES = {
        ...SERVICES,
        S3_SERVICE: JSON.stringify( s3Service ),
        TRUSTED_CONTACTS: JSON.stringify( trustedContacts ),
      }
      yield call( insertDBWorker, {
        payload: {
          SERVICES: updatedSERVICES
        },
      } )
      yield put( updateMSharesHealth( [
        {
          walletId: walletId,
          shareId: shareId,
          reshareVersion: share.meta.reshareVersion,
          updatedAt: moment( new Date() ).valueOf(),
          shareType: 'device',
          name: name,
          status: status,
        },
      ] ) )
      const notification: INotification = {
        notificationType: notificationType.reShare,
        title: 'New share uploaded',
        body: 'New share uploaded.',
        data: JSON.stringify( {
          selectedShareId: shareId, walletId: walletId
        } ),
        tag: notificationTag.IMP,
        date: new Date(),
      }
      const ress = yield fork(
        RelayServices.sendNotifications,
        [ {
          walletId: oldKeeperInfo.walletID, FCMs: oldKeeperInfo.FCMs
        } ],
        notification
      )
      yield put( updateAvailableKeeperData( [ {
        type: 'primary'
      } ] ) )
    }
    yield put( switchUpgradeLoader( 'secondarySetupAutoShare' ) )
  } catch ( error ) {
    console.log( 'error', error )
    yield put( switchUpgradeLoader( 'secondarySetupAutoShare' ) )
  }
}

export const autoShareSecondaryWatcher = createWatcher(
  autoShareSecondaryWorker,
  AUTO_UPLOAD_SECONDARY,
)

function* autoShareContactKeeperWorker( { payload } ) {
  try {
    yield put( switchUpgradeLoader( 'contactSetupAutoShare' ) )
    const { contactList, shareIds } = payload
    const contactListToMarkDone:{type: string; name: string;}[] = []
    const s3Service: S3Service = yield select( ( state ) => state.health.service )
    const levelToSetup: number = yield select( ( state ) => state.upgradeToNewBhr.levelToSetup )
    for ( let i = 0; i < shareIds.length; i++ ) {
      const element = shareIds[ i ]
      const name =  contactList[ i ] && contactList[ i ].firstName && contactList[ i ].lastName
        ? contactList[ i ].firstName + ' ' + contactList[ i ].lastName
        : contactList[ i ] && contactList[ i ].firstName && !contactList[ i ].lastName
          ? contactList[ i ].firstName
          : contactList[ i ] && !contactList[ i ].firstName && contactList[ i ].lastName
            ? contactList[ i ].lastName
            : ''
      const obj: KeeperInfoInterface = {
        shareId: element,
        name: name,
        type: 'contact',
        scheme: s3Service.levelhealth.metaSharesKeeper.find( value => value.shareId == element ).meta.scheme,
        currentLevel: levelToSetup,
        createdAt: moment( new Date() ).valueOf(),
        sharePosition: s3Service.levelhealth.metaSharesKeeper.findIndex( value => value.shareId == element ),
        data: {
          ...contactList[ i ], index: i + 1
        }
      }
      yield put( updatedKeeperInfo( obj ) )
    }
    const walletId = s3Service.getWalletId().data.walletId
    const { WALLET_SETUP, SERVICES } = yield select( ( state ) => state.storage.database )
    const keeperInfo = yield select( ( state ) => state.health.keeperInfo )
    const response = yield call( s3Service.updateKeeperInfoToMetaShare, keeperInfo, WALLET_SETUP.security.answer )
    const metaShares: MetaShare[] = s3Service.levelhealth.metaSharesKeeper
    const secondaryMetaShares: MetaShare[] = s3Service.levelhealth.SMMetaSharesKeeper
    const trustedContacts: TrustedContactsService = yield select( ( state ) => state.trustedContacts.service )
    const trustedContactsInfo: Keepers = trustedContacts.tc.trustedContacts
    for ( let i = 0; i < shareIds.length; i++ ) {
      const name =  contactList[ i ] && contactList[ i ].firstName && contactList[ i ].lastName
        ? contactList[ i ].firstName + ' ' + contactList[ i ].lastName
        : contactList[ i ] && contactList[ i ].firstName && !contactList[ i ].lastName
          ? contactList[ i ].firstName
          : contactList[ i ] && !contactList[ i ].firstName && contactList[ i ].lastName
            ? contactList[ i ].lastName
            : ''
      contactListToMarkDone.push( {
        name, type: contactList[ i ].type
      } )
      const shareId = shareIds[ i ]
      const share: MetaShare = metaShares.find( value => value.shareId == shareId )
      const oldKeeperInfo = trustedContactsInfo[ name.toLowerCase() ]
      const status = 'accessible'
      const data: TrustedDataElements = {
        metaShare: share,
        secondaryShare: secondaryMetaShares[ 1 ]
      }
      const res = yield call(
        trustedContacts.updateTrustedChannel,
        name,
        data,
        false
      )
      if ( res.status == 200 ) {
        const updatedSERVICES = {
          ...SERVICES,
          S3_SERVICE: JSON.stringify( s3Service ),
          TRUSTED_CONTACTS: JSON.stringify( trustedContacts ),
        }
        yield call( insertDBWorker, {
          payload: {
            SERVICES: updatedSERVICES
          },
        } )
        yield put( updateMSharesHealth( {
          walletId: walletId,
          shareId: shareId,
          reshareVersion: share.meta.reshareVersion,
          updatedAt: moment( new Date() ).valueOf(),
          shareType: 'contact',
          name: name,
          status: status,
        } ) )
        const notification: INotification = {
          notificationType: notificationType.reShare,
          title: 'New share uploaded',
          body: 'New share uploaded.',
          data: JSON.stringify( {
            selectedShareId: shareId, walletId: walletId
          } ),
          tag: notificationTag.IMP,
          date: new Date(),
        }
        const ress = yield fork(
          RelayServices.sendNotifications,
          [ {
            walletId: oldKeeperInfo.walletID, FCMs: oldKeeperInfo.FCMs
          } ],
          notification
        )
      }
    }
    yield put( updateAvailableKeeperData( contactListToMarkDone ) )
    yield put( switchUpgradeLoader( 'contactSetupAutoShare' ) )
  } catch ( error ) {
    console.log( 'error', error )
    yield put( switchUpgradeLoader( 'contactSetupAutoShare' ) )
  }
}

export const autoShareContactKeeperWatcher = createWatcher(
  autoShareContactKeeperWorker,
  AUTO_UPLOAD_CONTACT,
)

function* updateAvailableKeeperDataWorker( { payload } ) {
  try {
    yield put( switchUpgradeLoader( 'updateAvailKeeperDataStatus' ) )
    const object: {type: string; name?:string}[] = payload.object
    const availableKeeperData: {shareId: string; type: string; count: number; status?: boolean; contactDetails: any;}[] = yield select( ( state ) => state.upgradeToNewBhr.availableKeeperData )

    for ( let i = 0; i < availableKeeperData.length; i++ ) {
      const element = availableKeeperData[ i ]
      const objIndex = object.findIndex( value => value.type == element.type )
      if( objIndex > -1 && object[ objIndex ].name ) {
        const contactDetails = element.contactDetails
        const Name = contactDetails && contactDetails.firstName && contactDetails.lastName
          ? contactDetails.firstName + ' ' + contactDetails.lastName
          : contactDetails && contactDetails.firstName && !contactDetails.lastName
            ? contactDetails.firstName
            : contactDetails && !contactDetails.firstName && contactDetails.lastName
              ? contactDetails.lastName
              : ''
        if( Name == object[ objIndex ].name ) availableKeeperData[ i ].status = true
      }
      else if( objIndex > -1 && !object[ objIndex ].name ) {
        availableKeeperData[ i ].status = true
      }
    }
    yield put( setAvailableKeeperData( availableKeeperData ) )
    yield put( switchUpgradeLoader( 'updateAvailKeeperDataStatus' ) )
  } catch ( error ) {
    console.log( 'error', error )
    yield put( switchUpgradeLoader( 'updateAvailKeeperDataStatus' ) )
  }
}

export const updateAvailableKeeperDataWatcher = createWatcher(
  updateAvailableKeeperDataWorker,
  UPDATE_AVAILABLE_KEEPER_DATA,
)

function* confirmPDFSharedFromUpgradeWorker( { payload } ) {
  try {
    yield put( switchUpgradeLoader( 'pdfDataConfirm' ) )
    const { shareId, scannedData } = payload
    const s3Service: S3Service = yield select( ( state ) => state.health.service )
    const metaShare: MetaShare[] = s3Service.levelhealth.metaSharesKeeper
    const walletId = s3Service.levelhealth.walletId
    const answer = yield select( ( state ) => state.storage.database.WALLET_SETUP.security.answer )
    let shareIndex = 3
    if (
      shareId &&
      s3Service.levelhealth.metaSharesKeeper.length &&
      metaShare.findIndex( ( value ) => value.shareId == shareId ) > -1
    ) {
      shareIndex = metaShare.findIndex( ( value ) => value.shareId == shareId )
    }
    const scannedObj: {type: string, encryptedKey: string; encryptedData: string} = JSON.parse( scannedData )
    const decryptedData = LevelHealth.decryptWithAnswer( scannedObj.encryptedKey, answer ).decryptedString
    if( decryptedData == shareId ){
      const shareObj = {
        walletId: walletId,
        shareId: shareId,
        reshareVersion: metaShare[ shareIndex ].meta.reshareVersion,
        updatedAt: moment( new Date() ).valueOf(),
        name: 'Keeper PDF',
        shareType: 'pdf',
        status: 'accessible',
      }
      yield put( updateMSharesHealth( shareObj ) )
      yield put( onApprovalStatusChange( {
        status: false,
        initiatedAt: 0,
        shareId: '',
      } ) )
      yield put( updateAvailableKeeperData( [ {
        type:'pdf'
      } ] ) )
    }
    yield put( switchUpgradeLoader( 'pdfDataConfirm' ) )
  } catch ( error ) {
    yield put( switchUpgradeLoader( 'pdfDataConfirm' ) )
    console.log( 'Error EF channel', error )
  }
}

export const confirmPDFSharedFromUpgradeWatcher = createWatcher(
  confirmPDFSharedFromUpgradeWorker,
  CONFIRM_PDF_SHARED_UPGRADE
)
