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
  UPDATE_MESSAGES_STATUS_INAPP,
  UPDATE_MESSAGES_STATUS
} from '../actions/notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import moment from 'moment'
import Relay from '../../bitcoin/utilities/Relay'


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

    const { updated } = yield call(
      Relay.updateFCMTokens,
      data.walletId,
      payload.FCMs,
    )
    if ( !updated ) console.log( 'Failed to update FCMs on the server' )
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

  const { notifications } = yield call( Relay.fetchNotifications, data.walletId )
  const payload = {
    notifications
  }
  yield call( notificationsFetched, notifications )
  //yield call( setupNotificationListWorker )
  yield put( fetchNotificationStarted( false ) )
}

export const fetchNotificationsWatcher = createWatcher(
  fetchNotificationsWorker,
  FETCH_NOTIFICATIONS,
)


export function* getMessageWorker() {
  yield put( fetchNotificationStarted( true ) )
  const storedMessages = yield select(
    ( state ) => state.notifications.messages,
  )
  const walletId = yield select( ( state ) => state.preferences.walletId, )
  const timeStamp = yield select(
    ( state ) => state.notifications.timeStamp,
  )
  console.log( 'messages timeStamp', timeStamp )

  const { messages } = yield call( Relay.getMessages, walletId, timeStamp )
  if( !storedMessages ) return
  const newMessageArray = storedMessages.concat( messages.filter( ( { notificationId } ) => !storedMessages.find( f => f.notificationId == notificationId ) ) )
  console.log( 'newMessageArray', newMessageArray )

  yield put( messageFetched( newMessageArray ) )
  yield put( storeMessagesTimeStamp() )

  yield put( fetchNotificationStarted( false ) )
}

export const getMessageWatcher = createWatcher(
  getMessageWorker,
  GET_MESSAGES,
)


export function* updateMessageStatusInAppWorker( { payload } ) {
  const { messageNotificationId } = payload
  const messages = yield select(
    ( state ) => state.notifications.messages,
  )
  const messageArray = messages.map( message => (
    message.notificationId === messageNotificationId? {
      ...message, 'status': 'read',
    }: message
  ) )
  console.log( 'messageArray', messageArray )
  yield put( messageFetched( messageArray ) )
}

export const updateMessageStatusInAppWatcher = createWatcher(
  updateMessageStatusInAppWorker,
  UPDATE_MESSAGES_STATUS_INAPP,
)


export function* updateMessageStatusWorker( { payload } ) {
  try{
    const { data } = payload
    if ( data.length === 0 ) {
      throw new Error( 'No data found' )
    }
    const walletId = yield select( ( state ) => state.preferences.walletId, )
    const { updated } = yield call(
      Relay.updateMessageStatus,
      walletId,
      data,
    )
    if ( !updated ) console.log( 'Failed to update messageStatus on the server' )

  } catch( err ){
    console.log( 'err', err )
  }
}

export const updateMessageStatusWatcher = createWatcher(
  updateMessageStatusWorker,
  UPDATE_MESSAGES_STATUS,
)
