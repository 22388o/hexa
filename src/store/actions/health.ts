// types and action creators: dispatched by components and sagas

import { share } from "secrets.js-grempe";

export const INIT_HEALTH_SETUP = 'INIT_HEALTH_SETUP';
export const HEALTH_UPDATE = 'HEALTH_UPDATE';
export const HEALTH_CHECK_INITIALIZED = 'HEALTH_CHECK_INITIALIZED';
export const HEALTH_CHECK_INITIALIZE = 'HEALTH_CHECK_INITIALIZE';
export const INIT_HEALTH_CHECK = 'INIT_HEALTH_CHECK';
export const S3_LOADING_STATUS = 'S3_LOADING_STATUS';
export const INIT_LOADING_STATUS = 'INIT_LOADING_STATUS';
export const PREPARE_MSHARES = 'PREPARE_MSHARES';
export const UPDATE_HEALTH = 'UPDATE_HEALTH';
export const GET_HEALTH_OBJECT = 'GET_HEALTH_OBJECT';
export const CHECK_SHARES_HEALTH = 'CHECK_SHARES_HEALTH';
export const ERROR_SENDING = 'ERROR_SENDING';
export const UPDATE_SHARES_HEALTH = 'UPDATE_SHARES_HEALTH';
export const UPDATE_MSHARE_LOADING_STATUS = 'UPDATE_MSHARE_LOADING_STATUS';
export const GENERATE_META_SHARE = 'GENERATE_META_SHARE';
export const MSHARES = 'MSHARES';
export const CREATE_N_UPLOAD_ON_EF_CHANNEL = 'CREATE_N_UPLOAD_ON_EF_CHANNEL';
export const UPDATE_EFCHANNEL_LOADING_STATUS = 'UPDATE_EFCHANNEL_LOADING_STATUS';
export const IS_LEVEL_TWO_METASHARE = 'IS_LEVEL_TWO_METASHARE';  
export const IS_LEVEL_THREE_METASHARE = 'IS_LEVEL_THREE_METASHARE';
export const INIT_LEVEL_TWO = 'INIT_LEVEL_TWO';
export const IS_LEVEL2_INITIALIZED = 'IS_LEVEL2_INITIALIZED';
export const KEEPER_INFO = 'KEEPER_INFO';

export const initHealthCheck = () => {
  return { type: INIT_HEALTH_CHECK };
};

export const initializeHealthSetup = () => {
  return { type: INIT_HEALTH_SETUP };
};

export const updateHealth = (health, currentLevel) => {
  return { type: HEALTH_UPDATE, payload: { health, currentLevel } };
};

export const healthInitialize = () => {
  return { type: HEALTH_CHECK_INITIALIZE };
};

export const healthInitialized = () => {
  return { type: HEALTH_CHECK_INITIALIZED };
};

export const switchS3LoadingStatus = (beingLoaded) => {
  return { type: S3_LOADING_STATUS, payload: { beingLoaded } };
};

export const initLoader = (beingLoaded) => {
  return { type: INIT_LOADING_STATUS, payload: { beingLoaded } };
};

export const healthCheckInitialized = () => {
  return { type: HEALTH_CHECK_INITIALIZED };
};

export const prepareMShares = () => {
  return { type: PREPARE_MSHARES };
};

export const getHealth = () => {
  return { type: GET_HEALTH_OBJECT };
};

export const checkMSharesHealth = () => {
  return { type: CHECK_SHARES_HEALTH };
};

export const ErrorSending = (isFailed) => {
  return { type: ERROR_SENDING, payload: { isFailed } };
};

export const updateMSharesHealth = (shares) => {
  return { type: UPDATE_SHARES_HEALTH, payload: { shares } };
};

export const updateMSharesLoader = (beingLoaded) => {
  return { type: UPDATE_MSHARE_LOADING_STATUS, payload: { beingLoaded } };
};

export const generateMetaShare = (level) => {
  return { type: GENERATE_META_SHARE, payload: { level } };
};

export const sharesGenerated = (shares) => {
  return { type: MSHARES, payload: { shares } };
};

export const createAndUploadOnEFChannel = (
  scannedData,
  featuresList,
  isPrimaryKeeper,
  selectedShareId
) => {
  return {
    type: CREATE_N_UPLOAD_ON_EF_CHANNEL,
    payload: { scannedData, featuresList, isPrimaryKeeper, selectedShareId },
  };
};

export const updateEFChannelLoader = (beingLoaded) => {
  return { type: UPDATE_EFCHANNEL_LOADING_STATUS, payload: { beingLoaded } };
};

export const updateLevelTwoMetaShareStatus = (beingLoaded) => {
  return { type: IS_LEVEL_TWO_METASHARE, payload: { beingLoaded } };
};

export const updateLevelThreeMetaShareStatus = (beingLoaded) => {
  return { type: IS_LEVEL_THREE_METASHARE, payload: { beingLoaded } };
};

export const initLevelTwo = () => {
  return { type: INIT_LEVEL_TWO };
};

export const isLevel2InitializedStatus = (beingLoaded) => {
  return { type: IS_LEVEL2_INITIALIZED, payload: { beingLoaded } };
};

export const updatedKeeperInfo = (info) =>{
  return { type: KEEPER_INFO, payload: { info } };
}
