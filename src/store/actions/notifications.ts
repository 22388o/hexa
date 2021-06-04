// types and action creators: dispatched by components and sagas

import {
  notificationTag,
  notificationType,
} from '../../bitcoin/utilities/Interface'

export const UPDATE_FCM_TOKENS = 'UPDATE_FCM_TOKENS'
export const SEND_NOTIFICATION = 'SEND_NOTIFICATION'
export const FETCH_NOTIFICATIONS = 'FETCH_NOTIFICATIONS'
export const NOTIFICATION_UPDATED = 'NOTIFICATION_UPDATED'
export const SETUP_NOTIFICATION_LIST = 'SETUP_NOTIFICATION_LIST'
export const UPDATED_NOTIFICATION_LIST = 'UPDATED_NOTIFICATION_LIST'
export const FETCH_NOTIFICATION_STARTED = 'FETCH_NOTIFICATION_STARTED'
export const GET_MESSAGES = 'GET_MESSAGES'
export const STORE_MESSAGE_TIMESTAMP = 'STORE_MESSAGE_TIMESTAMP'
export const MESSAGES_FETCHED = 'MESSAGES_FETCHED'

export const updateFCMTokens = ( FCMs: string[] ) => {
  return {
    type: UPDATE_FCM_TOKENS,
    payload: {
      FCMs
    },
  }
}

export const sendNotification = (
  contactName: string,
  notificationType: notificationType,
  title: string,
  body: string,
  data: Object,
  tag: notificationTag,
) => {
  return {
    type: SEND_NOTIFICATION,
    payload: {
      contactName, notificationType, title, body, data, tag
    },
  }
}

export const fetchNotifications = () => {
  return {
    type: FETCH_NOTIFICATIONS,
  }
}
export const setupNotificationList = ( ) => {
  return {
    type: SETUP_NOTIFICATION_LIST
  }
}

// types and action creators: dispatched sagas

export const NOTIFICATIONS_FETCHED = 'NOTIFICATIONS_FETCHED'

export const notificationsFetched = ( notifications ) => {
  console.log( 'notificationsFetched notifications', notifications )
  return {
    type: NOTIFICATIONS_FETCHED,
    payload: {
      notifications
    },
  }
}

export const notificationsUpdated = ( notifications ) => {
  return {
    type: NOTIFICATION_UPDATED,
    payload: {
      notificationListNew: notifications
    },
  }
}

export const updateNotificationList = ( notifications ) => {
  return {
    type: UPDATED_NOTIFICATION_LIST,
    payload: {
      updatedNotificationList: notifications
    },
  }
}

export const fetchNotificationStarted = ( fetchStarted ) => {
  return {
    type: FETCH_NOTIFICATION_STARTED, payload: {
      fetchStarted
    }
  }
}

export const getMessages = () => {
  return {
    type: GET_MESSAGES,
  }
}

export const storeMessagesTimeStamp = () => {
  return {
    type: STORE_MESSAGE_TIMESTAMP,
  }
}

export const messageFetched = ( messages ) => {
  console.log( 'messagesFetched messages', messages )
  return {
    type: MESSAGES_FETCHED,
    payload: {
      messages
    },
  }
}

