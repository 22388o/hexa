/* eslint-disable @typescript-eslint/no-explicit-any */
import Client from 'bitcoin-core'
import * as bitcoinJS from 'bitcoinjs-lib'
import {
  DerivativeAccount,
  DerivativeAccounts,
  TrustedContactDerivativeAccount,
  DonationDerivativeAccount,
} from './utilities/Interface'
import Config from 'react-native-config'
import {
  DONATION_ACCOUNT,
  SUB_PRIMARY_ACCOUNT,
} from '../common/constants/serviceTypes'
import { AsyncStorage } from 'react-native'
import PersonalNode from '../common/data/models/PersonalNode'

class HexaConfig {
  public VERSION: string = Config.VERSION ? Config.VERSION.trim() : '';
  public ENVIRONMENT: string;
  public NETWORK: bitcoinJS.Network;
  public BITCOIN_NODE: Client;
  public SECURE_WALLET_XPUB_PATH: string = Config.BIT_SECURE_WALLET_XPUB_PATH.trim() || '2147483651/2147483649/';
  public SECURE_DERIVATION_BRANCH: string = Config.BIT_SECURE_DERIVATION_BRANCH.trim() || '1';
  public TOKEN: string = Config.BIT_BLOCKCYPHER_API_URLS_TOKEN.trim();
  public SSS_OTP_LENGTH: string = Config.BIT_SSS_OTP_LENGTH.trim();
  public REQUEST_TIMEOUT: number = Config.BIT_REQUEST_TIMEOUT ? parseInt( Config.BIT_REQUEST_TIMEOUT.trim(), 10 ) : 15000;
  public GAP_LIMIT: number = Config.BIT_GAP_LIMIT ? parseInt( Config.BIT_GAP_LIMIT.trim(), 10 ) : 5;
  public DERIVATIVE_GAP_LIMIT = 5;
  public CIPHER_SPEC: {
    algorithm: string;
    salt: string;
    iv: Buffer;
    keyLength: number;
  } = {
    algorithm: Config.BIT_CIPHER_ALGORITHM.trim(),
    salt: Config.BIT_CIPHER_SALT.trim(),
    keyLength: parseInt( Config.BIT_CIPHER_KEYLENGTH.trim(), 10 ),
    iv: Buffer.alloc( 16, 0 ),
  };
  public KEY_STRETCH_ITERATIONS = parseInt(
    Config.BIT_KEY_STRETCH_ITERATIONS.trim(),
    10,
  );

  public LAST_SEEN_ACTIVE_DURATION: number = parseInt(
    Config.LAST_SEEN_ACTIVE_DURATION.trim(),
    10,
  );
  public LAST_SEEN_AWAY_DURATION: number = parseInt(
    Config.LAST_SEEN_AWAY_DURATION.trim(),
    10,
  );

  public BH_SERVERS = {
    RELAY: Config.BIT_API_URLS_RELAY.trim(),
    SIGNING_SERVER: Config.BIT_API_URLS_SIGNING_SERVER.trim(),
  };
  public BSI = {
    INIT_INDEX: Config.BIT_BSI_INIT_INDEX ? parseInt( Config.BIT_BSI_INIT_INDEX.trim(), 10 ) : 100,
    MAXUSEDINDEX: Config.BIT_BSI_MAXUSEDINDEX ? parseInt( Config.BIT_BSI_MAXUSEDINDEX.trim(), 10 ) : 0,
    MINUNUSEDINDEX: Config.BIT_BSI_MINUNUSEDINDEX ? parseInt( Config.BIT_BSI_MINUNUSEDINDEX.trim(), 10 ) : 1000000,
    DEPTH: {
      INIT: Config.BIT_BSI_DEPTH_INIT ? parseInt( Config.BIT_BSI_DEPTH_INIT.trim(), 10 ) : 0,
      LIMIT: Config.BIT_BSI_DEPTH_LIMIT ? parseInt( Config.BIT_BSI_DEPTH_LIMIT.trim(), 10 ) : 20,
    },
  };
  public SSS_TOTAL: number = parseInt( Config.BIT_SSS_TOTAL.trim(), 10 );
  public SSS_THRESHOLD: number = parseInt( Config.BIT_SSS_THRESHOLD.trim(), 10 );
  public MSG_ID_LENGTH: number = parseInt( Config.BIT_MSG_ID_LENGTH.trim(), 10 );
  public CHUNK_SIZE: number = Config.BIT_CHUNK_SIZE ? parseInt( Config.BIT_CHUNK_SIZE.trim(), 10 ) : 3;
  public CHECKSUM_ITR: number = parseInt( Config.BIT_CHECKSUM_ITR.trim(), 10 );
  public HEXA_ID: string = Config.BIT_HEXA_ID.trim();
  public DPATH_PURPOSE: number = Config.BIT_DPATH_PURPOSE ? parseInt( Config.BIT_DPATH_PURPOSE.trim(), 10 ) : 49;
  public SSS_METASHARE_SPLITS: number = parseInt(
    Config.BIT_SSS_METASHARE_SPLITS.trim(),
    10,
  );
  public STATUS = {
    SUCCESS: Config.BIT_SUCCESS_STATUS_CODE ? parseInt( Config.BIT_SUCCESS_STATUS_CODE.trim(), 10 ) : 200,
    ERROR: Config.BIT_ERROR_STATUS_CODE ? parseInt( Config.BIT_ERROR_STATUS_CODE.trim(), 10 ) : 400,
  };
  public STANDARD = {
    BIP44: Config.BIT_STANDARD_BIP44 ? parseInt( Config.BIT_STANDARD_BIP44.trim(), 10 ) : 44,
    BIP49: Config.BIT_STANDARD_BIP49 ? parseInt( Config.BIT_STANDARD_BIP49.trim(), 10 ) : 49,
    BIP84: Config.BIT_STANDARD_BIP84 ? parseInt( Config.BIT_STANDARD_BIP84.trim(), 10 ) : 84,
  };

  public HEALTH_STATUS = {
    HEXA_HEALTH: {
      STAGE1: Config.BIT_HEXA_HEALTH_STAGE1.trim(),
      STAGE2: Config.BIT_HEXA_HEALTH_STAGE2.trim(),
      STAGE3: Config.BIT_HEXA_HEALTH_STAGE3.trim(),
      STAGE4: Config.BIT_HEXA_HEALTH_STAGE4.trim(),
      STAGE5: Config.BIT_HEXA_HEALTH_STAGE5.trim(),
    },

    ENTITY_HEALTH: {
      STAGE1: Config.BIT_ENTITY_HEALTH_STAGE1.trim(),
      STAGE2: Config.BIT_ENTITY_HEALTH_STAGE2.trim(),
      STAGE3: Config.BIT_ENTITY_HEALTH_STAGE3.trim(),
    },

    TIME_SLOTS: {
      SHARE_SLOT1: parseInt( Config.BIT_SHARE_HEALTH_TIME_SLOT1.trim(), 10 ),
      SHARE_SLOT2: parseInt( Config.BIT_SHARE_HEALTH_TIME_SLOT2.trim(), 10 ),
    },
  };

  public LEGACY_TC_REQUEST_EXPIRY = parseInt(
    Config.BIT_LEGACY_TC_REQUEST_EXPIRY.trim(),
    10,
  );
  public TC_REQUEST_EXPIRY = parseInt( Config.BIT_TC_REQUEST_EXPIRY.trim(), 10 );

  public ESPLORA_API_ENDPOINTS = {
    TESTNET: {
      MULTIBALANCE: Config.BIT_ESPLORA_TESTNET_MULTIBALANCE ? Config.BIT_ESPLORA_TESTNET_MULTIBALANCE.trim() : 'https://testapi.bithyve.com/balances',
      MULTIUTXO: Config.BIT_ESPLORA_TESTNET_MULTIUTXO ? Config.BIT_ESPLORA_TESTNET_MULTIUTXO.trim() : 'https://testapi.bithyve.com/utxos',
      MULTITXN: Config.BIT_ESPLORA_TESTNET_MULTITXN ? Config.BIT_ESPLORA_TESTNET_MULTITXN.trim() : 'https://testapi.bithyve.com/data',
      MULTIBALANCETXN: Config.BIT_ESPLORA_TESTNET_MULTIBALANCETXN ? Config.BIT_ESPLORA_TESTNET_MULTIBALANCETXN.trim() : 'https://testapi.bithyve.com/baltxs',
      NEWMULTIUTXOTXN: Config.BIT_ESPLORA_TESTNET_NEW_MULTIUTXOTXN ? Config.BIT_ESPLORA_TESTNET_NEW_MULTIUTXOTXN.trim() : 'https://test-wrapper.bithyve.com/nutxotxs',
      TXN_FEE: Config.BIT_ESPLORA_TESTNET_TXNFEE ? Config.BIT_ESPLORA_TESTNET_TXNFEE.trim() : 'https://testapi.bithyve.com/fee-estimates',
      TXNDETAILS: Config.BIT_ESPLORA_TESTNET_TXNDETAILS ? Config.BIT_ESPLORA_TESTNET_TXNDETAILS.trim() : 'https://testapi.bithyve.com/tx',
      BROADCAST_TX: Config.BIT_ESPLORA_TESTNET_BROADCAST_TX ? Config.BIT_ESPLORA_TESTNET_BROADCAST_TX.trim() : 'https://testapi.bithyve.com/tx',
    },
    MAINNET: {
      MULTIBALANCE: Config.BIT_ESPLORA_MAINNET_MULTIBALANCE ? Config.BIT_ESPLORA_MAINNET_MULTIBALANCE.trim() : 'https://api.bithyve.com/balances',
      MULTIUTXO: Config.BIT_ESPLORA_MAINNET_MULTIUTXO ? Config.BIT_ESPLORA_MAINNET_MULTIUTXO.trim() : 'https://api.bithyve.com/utxos',
      MULTITXN: Config.BIT_ESPLORA_MAINNET_MULTITXN ? Config.BIT_ESPLORA_MAINNET_MULTITXN.trim() : 'https://api.bithyve.com/data',
      MULTIBALANCETXN: Config.BIT_ESPLORA_MAINNET_MULTIBALANCETXN ? Config.BIT_ESPLORA_MAINNET_MULTIBALANCETXN.trim() : 'https://api.bithyve.com/baltxs',
      NEWMULTIUTXOTXN: Config.BIT_ESPLORA_MAINNET_NEW_MULTIUTXOTXN ? Config.BIT_ESPLORA_MAINNET_NEW_MULTIUTXOTXN.trim() : 'https://api.bithyve.com/nutxotxs',
      TXN_FEE: Config.BIT_ESPLORA_MAINNET_TXNFEE ? Config.BIT_ESPLORA_MAINNET_TXNFEE.trim() : 'https://api.bithyve.com/fee-estimates',
      TXNDETAILS: Config.BIT_ESPLORA_MAINNET_TXNDETAILS ? Config.BIT_ESPLORA_MAINNET_TXNDETAILS.trim() : 'https://api.bithyve.com/tx',
      BROADCAST_TX: Config.BIT_ESPLORA_MAINNET_BROADCAST_TX ? Config.BIT_ESPLORA_MAINNET_BROADCAST_TX.trim() : 'https://api.bithyve.com/tx',
    },
  };

  public RELAY: string;
  public SIGNING_SERVER: string;
  public APP_STAGE: string;

  public API_URLS = {
    TESTNET: {
      BASE: Config.BIT_API_URLS_TESTNET_BASE.trim(),
      BLOCKCHAIN_INFO_BASE: Config.BIT_API_URLS_BLOCKCHAIN_INFO_TESTNET_BASE.trim(),
      BALANCE_CHECK: Config.BIT_API_URLS_TESTNET_BALANCE_CHECK.trim(),
      UNSPENT_OUTPUTS: Config.BIT_API_URLS_TESTNET_UNSPENT_OUTPUTS.trim(),
      BROADCAST: Config.BIT_API_URLS_TESTNET_BROADCAST.trim(),
      TX_DECODE: Config.BIT_API_URLS_TESTNET_TX_DECODE.trim(),
      TX_FETCH: {
        URL: Config.BIT_API_URLS_TESTNET_TX_FETCH_URL.trim(),
        LIMIT: Config.BIT_API_URLS_TESTNET_TX_LIMIT.trim(),
      },
      FUND: {
        URL: Config.BIT_API_URLS_TESTNET_FUND_URL.trim(),
      },
    },
    MAINNET: {
      BASE: Config.BIT_API_URLS_MAINNET_BASE.trim(),
      BLOCKCHAIN_INFO_BASE: Config.BIT_API_URLS_BLOCKCHAIN_INFO_MAINNET_BASE.trim(),
      BALANCE_CHECK: Config.BIT_API_URLS_MAINNET_BALANCE_CHECK.trim(),
      UNSPENT_OUTPUTS: Config.BIT_API_URLS_MAINNET_UNSPENT_OUTPUTS.trim(),
      BROADCAST: Config.BIT_API_URLS_MAINNET_BROADCAST.trim(),
      TX_DECODE: Config.BIT_API_URLS_MAINNET_TX_DECODE.trim(),
      TX_FETCH: {
        URL: Config.BIT_API_URLS_MAINNET_TX_FETCH_URL.trim(),
        LIMIT: Config.BIT_API_URLS_MAINNET_TX_LIMIT.trim(),
      },
    },
  };

  public SUB_PRIMARY_ACCOUNT: DerivativeAccount = {
    series: parseInt( Config.BIT_SUB_PRIMARY_ACCOUNT_SERIES.trim(), 10 ),
    instance: {
      max: parseInt( Config.BIT_SUB_PRIMARY_ACCOUNT_INSTANCE_COUNT.trim(), 10 ),
      using: 0,
    },
  };

  public FAST_BITCOINS: DerivativeAccount = {
    series: parseInt( Config.BIT_FAST_BITCOINS_SERIES.trim(), 10 ),
    instance: {
      max: parseInt( Config.BIT_FAST_BITCOINS_INSTANCE_COUNT.trim(), 10 ),
      using: 0,
    },
  };

  public TRUSTED_CONTACTS: TrustedContactDerivativeAccount = {
    // corresponds to trusted channels
    series: parseInt( Config.BIT_TRUSTED_CONTACTS_SERIES.trim(), 10 ),
    instance: {
      max: parseInt( Config.BIT_TRUSTED_CONTACTS_INSTANCE_COUNT.trim(), 10 ),
      using: 0,
    },
  };

  public DONATION_ACCOUNT: DonationDerivativeAccount = {
    series: parseInt( Config.BIT_DONATION_ACCOUNT_SERIES.trim(), 10 ),
    instance: {
      max: parseInt( Config.BIT_DONATION_ACCOUNT_INSTANCE_COUNT.trim(), 10 ),
      using: 0,
    },
  };

  public DERIVATIVE_ACC: DerivativeAccounts = {
    SUB_PRIMARY_ACCOUNT: this.SUB_PRIMARY_ACCOUNT,
    FAST_BITCOINS: this.FAST_BITCOINS,
    TRUSTED_CONTACTS: this.TRUSTED_CONTACTS,
    DONATION_ACCOUNT: this.DONATION_ACCOUNT,
  };

  public EJECTED_ACCOUNTS = [ SUB_PRIMARY_ACCOUNT, DONATION_ACCOUNT ];

  public DERIVATIVE_ACC_TO_SYNC = Object.keys( this.DERIVATIVE_ACC ).filter(
    ( account ) => !this.EJECTED_ACCOUNTS.includes( account ),
  );

  constructor( env: string ) {
    this.ENVIRONMENT = env || 'MAIN'
    // console.log({ env });

    // console.log({ BIT_SERVER_MODE: Config.BIT_SERVER_MODE.trim() });

    this.RELAY = this.BH_SERVERS.RELAY
    this.SIGNING_SERVER = this.BH_SERVERS.SIGNING_SERVER
    this.HEALTH_STATUS.TIME_SLOTS.SHARE_SLOT1 = parseInt(
      Config.BIT_SHARE_HEALTH_TIME_SLOT1.trim(),
      10,
    )
    this.HEALTH_STATUS.TIME_SLOTS.SHARE_SLOT2 = parseInt(
      Config.BIT_SHARE_HEALTH_TIME_SLOT2.trim(),
      10,
    )

    // console.log(this.HEALTH_STATUS.TIME_SLOTS);
    // console.log({ tcExpiry: this.TC_REQUEST_EXPIRY });

    // console.log(Config.BIT_SERVER_MODE.trim(), this.RELAY, this.SIGNING_SERVER);
    this.setNetwork()

    this.BITCOIN_NODE = new Client( {
      network:
        this.NETWORK === bitcoinJS.networks.bitcoin ? 'mainnet' : 'testnet',
      timeout: 10000,
      username: Config.BIT_RPC_USERNAME.trim(),
      password: Config.BIT_RPC_PASSWORD.trim(),
      host: Config.BIT_HOST_IP.trim(),
    } )

    if (
      Config.BIT_SERVER_MODE.trim() === 'LOCAL' ||
      Config.BIT_SERVER_MODE.trim() === 'DEV'
    ) {
      this.APP_STAGE = 'dev'
    } else if ( Config.BIT_SERVER_MODE.trim() === 'STA' ) {
      this.APP_STAGE = 'sta'
    } else {
      this.APP_STAGE = 'app'
    }

    this.connectToPersonalNode()
  }

  public setNetwork = (): void => {
    if ( this.ENVIRONMENT === 'MAIN' ) {
      this.NETWORK = bitcoinJS.networks.bitcoin
    } else {
      this.NETWORK = bitcoinJS.networks.testnet
    }
  };

  public connectToPersonalNode =  async () => {
    const personalNodeData = await AsyncStorage.getItem( 'PersonalNode' )

    if( personalNodeData ){
      const personalNode: PersonalNode = JSON.parse( personalNodeData )
      const personalNodeURL = personalNode.activeNodeURL

      if( personalNodeURL ){
        const ownNodeEPs = {
          MULTIBALANCE: personalNodeURL + '/balances',
          MULTIUTXO:  personalNodeURL + '/utxos',
          MULTITXN: personalNodeURL + '/data',
          MULTIBALANCETXN: personalNodeURL + '/baltxs',
          MULTIUTXOTXN: personalNodeURL + '/utxotxs',
          NEWMULTIUTXOTXN: personalNodeURL + '/nutxotxs',
          TXN_FEE: personalNodeURL  + 'fee-estimates',
          TXNDETAILS: personalNodeURL + '/tx',
          BROADCAST_TX: personalNodeURL + '/tx',
        }

        if( this.ENVIRONMENT === 'MAIN' )
          this.ESPLORA_API_ENDPOINTS = {
            ...this.ESPLORA_API_ENDPOINTS,
            MAINNET: ownNodeEPs
          }
        else
          this.ESPLORA_API_ENDPOINTS = {
            ...this.ESPLORA_API_ENDPOINTS,
            TESTNET: ownNodeEPs,
          }
      }
    }
  }
}

export default new HexaConfig( Config.BIT_ENVIRONMENT.trim() )
