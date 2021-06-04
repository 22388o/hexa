import { call, put, select } from 'redux-saga/effects'
import RegularAccount from '../../bitcoin/services/accounts/RegularAccount'
import { REGULAR_ACCOUNT } from '../../common/constants/wallet-service-types'
import { createWatcher } from '../utils/utilities'
import {
  UPDATE_FCM_TOKENS,
  SEND_NOTIFICATION,
  FETCH_NOTIFICATIONS,
  notificationsFetched,
  fetchNotificationStarted,
  GET_MESSAGES,
  storeMessagesTimeStamp,
  messageFetched,
} from '../actions/notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import RelayServices from '../../bitcoin/services/RelayService'
import moment from 'moment'


function* updateFCMTokensWorker( { payload } ) {
  try{
    const { FCMs } = payload
    if ( FCMs.length === 0 ) {
      throw new Error( 'No FCM token found' )
    }

    const service: RegularAccount = yield select(
      ( state ) => state.accounts[ REGULAR_ACCOUNT ].service,
    )
    const { data } = yield call( service.getWalletId )
    console.log( 'data updateFCMTokensWorker', data )

    const res = yield call(
      RelayServices.updateFCMTokens,
      data.walletId,
      payload.FCMs,
    )

    if ( res.status === 200 ) {
      const { updated } = res.data
      console.log( {
        updated
      } )
    } else {
      console.log( 'Failed to update FCMs on the server' )
    }
  } catch( err ){
    console.log( 'err', err )
  }
}

export const updateFCMTokensWatcher = createWatcher(
  updateFCMTokensWorker,
  UPDATE_FCM_TOKENS,
)

export function* fetchNotificationsWorker() {
  yield put( fetchNotificationStarted( true ) )
  const service: RegularAccount = yield select(
    ( state ) => state.accounts[ REGULAR_ACCOUNT ].service,
  )
  console.log( 'service', service )
  const { data } = yield call( service.getWalletId )
  console.log( 'data', data )

  const res = yield call( RelayServices.fetchNotifications, data.walletId )
  if ( res.status === 200 ) {
    const { notifications, DHInfos } = res.data
    yield call( AsyncStorage.setItem, 'DHInfos', JSON.stringify( DHInfos ) )
    const payload = {
      notifications
    }
    yield call( notificationsFetched, notifications )
    //yield call( setupNotificationListWorker )
    yield put( fetchNotificationStarted( false ) )

  } else {
    console.log( 'Failed to fetch notification' )
  }
}

export const fetchNotificationsWatcher = createWatcher(
  fetchNotificationsWorker,
  FETCH_NOTIFICATIONS,
)


export function* getMessageWorker() {
  yield put( fetchNotificationStarted( true ) )
  const messages = yield select(
    ( state ) => state.notifications.messages,
  )
  const walletId = yield select( ( state ) => state.preferences.walletId, )
  const storeMessageTime = yield select(
    ( state ) => state.notifications.storeMessageTime,
  )
  console.log( 'messages getMessageWorker', typeof messages, messages,  )
  // const res = yield call( RelayServices.getMessages, walletId, storeMessageTime )
  // if ( res.status === 200 ) {
  //   const { notifications } = res.data
  //   const newMessageArray = messages.concat( notifications.filter( ( { notificationId } ) => !messages.find( f => f.notificationId == notificationId ) ) )
  //   console.log( 'newMessageArray', newMessageArray )

  //   yield put( messageFetched( newMessageArray ) )
  //   yield put( storeMessagesTimeStamp() )

  //   yield put( fetchNotificationStarted( false ) )
  // } else {
  //   console.log( 'Failed to fetch notification' )
  // }
  const notifications = [ {
    'type' : 'FNF_REQUEST',
    'status': 'unread',
    'title': 'F&F request',
    'info': 'F&F request awaiting',
    'timeStamp': moment( new Date() ),
    'notificationId': 1,
    'AdditionalInfo': {
    }
  },
  {
    'type' : 'FNF_KEEPER_REQUEST',
    'status': 'unread',
    'title': 'F&F Keeper request',
    'info': 'F&F Keeper request awaiting',
    'timeStamp': moment( new Date() ),
    'notificationId': 2,
    'AdditionalInfo': {
    }
  },
  {
    'type' : 'FNF_TRANSACTION',
    'status': 'unread',
    'title': 'Transaction',
    'info': '',
    'timeStamp': moment( new Date() ),
    'notificationId': 3,
    'AdditionalInfo': {
    }
  },
  {
    'type' : 'RELEASE',
    'status': 'unread',
    'title': 'We’re better than ever\nTime to update',
    'info': 'New Release',
    'timeStamp': new Date(),
    'notificationId': 4,
    'AdditionalInfo': {
    }
  },
  ]

  const newMessageArray = messages.concat( notifications.filter( ( { notificationId } ) => !messages.find( f => f.notificationId == notificationId ) ) )
  console.log( 'newMessageArray', newMessageArray )

  yield put( messageFetched( newMessageArray ) )
  yield put( storeMessagesTimeStamp() )

  yield put( fetchNotificationStarted( false ) )
}

export const getMessageWatcher = createWatcher(
  getMessageWorker,
  GET_MESSAGES,
)
