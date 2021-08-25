import React, { useMemo } from 'react'
import { StyleSheet, View, Image, Text } from 'react-native'
import { ListItem, Icon } from 'react-native-elements'
import moment from 'moment'
import Colors from '../../common/Colors'
import Fonts from '../../common/Fonts'
import { RFValue } from 'react-native-responsive-fontsize'
import BitcoinUnit from '../../common/data/enums/BitcoinUnit'
import CurrencyKind from '../../common/data/enums/CurrencyKind'
import TransactionKind from '../../common/data/enums/TransactionKind'
import TransactionDescribing from '../../common/data/models/Transactions/Interfaces'
import useCurrencyKind from '../../utils/hooks/state-selectors/UseCurrencyKind'
import LabeledBalanceDisplay from '../LabeledBalanceDisplay'
import { AccountType } from '../../bitcoin/utilities/Interface'
import getAvatarForSubAccount from '../../utils/accounts/GetAvatarForSubAccountKind'
import usePrimarySubAccountForShell from '../../utils/hooks/account-utils/UsePrimarySubAccountForShell'
import useAccountShellForID from '../../utils/hooks/state-selectors/accounts/UseAccountShellForID'

export type Props = {
  transaction: TransactionDescribing;
  bitcoinUnit?: BitcoinUnit;
  currencyKind?: CurrencyKind | null;
  accountShellId: string,
};

const TransactionListItemContent: React.FC<Props> = ( {
  transaction,
  bitcoinUnit = BitcoinUnit.SATS,
  currencyKind = useCurrencyKind(),
  accountShellId,
}: Props ) => {

  const primarySubAccount = usePrimarySubAccountForShell(
    useAccountShellForID( accountShellId )
  )

  const transactionKindIconName = useMemo( () => {
    switch ( transaction.transactionType ) {
        case TransactionKind.RECEIVE:
          return 'long-arrow-down'
        case TransactionKind.SEND:
          return 'long-arrow-up'
    }
  }, [ transaction.transactionType ] )

  const transactionKindIconColor = useMemo( () => {
    switch ( transaction.transactionType ) {
        case TransactionKind.RECEIVE:
          return Colors.green
        case TransactionKind.SEND:
          return Colors.red
    }
  }, [ transaction.transactionType ] )

  const amountTextStyle = useMemo( () => {
    return {
      ...styles.amountText,
      color: transactionKindIconColor,
    }
  }, [ transaction.transactionType ] )

  const getTitle = useMemo( () => {
    if( transaction.transactionType === TransactionKind.RECEIVE ) {
      return transaction.sender || ( transaction.accountName? transaction.accountName: transaction.accountType )
    } else {
      let name = ''
      if( transaction.receivers ) {
        if( transaction.receivers.length > 1 ) {
          name = `${transaction.receivers[ 0 ].name ? transaction.receivers[ 0 ].name : transaction.recipientAddresses[ 0 ]} and ${transaction.receivers.length - 1} other`
        } else {
          name = transaction.receivers[ 0 ] ? transaction.receivers[ 0 ].name : null ||  transaction.accountType || transaction.accountName
        }
      } else {
        name =  transaction.accountName? transaction.accountName: transaction.accountType
      }
      return name
    }

  }, [ transaction.transactionType ] )

  const formattedDateText = useMemo( () => {
    return moment( transaction.date ).format( 'DD/MM/YYYY • hh:MMa' )
  }, [ transaction.transactionType ] )

  const getReceiversCount = useMemo( () => {
    if( transaction.transactionType === TransactionKind.SEND ) {
      if( transaction.receivers ) {
        if( transaction.receivers.length > 1 ) {
          return `+${transaction.receivers.length}`
        } else {
          return ''
        }
      } else {
        return ''
      }
    } else {
      return ''
    }
  }, [ transaction.receivers ] )

  const confirmationsText = useMemo( () => {
    return transaction.confirmations > 6 ?
      '6+'
      : `${transaction.confirmations}`
  }, [ transaction.confirmations ] )

  return (
    <>

      {/* <Icon
        style={styles.transactionKindIcon}
        name={transactionKindIconName}
        type={'font-awesome'}
        color={transactionKindIconColor}
        size={13}
      /> */}

      <View style={styles.containerImg}>
        <Image
          source={getAvatarForSubAccount( primarySubAccount, false, true )}
          style={styles.avatarImage}
          resizeMode="contain"
        />

        {
          transaction.isNew &&(
            <View style={styles.dot}/>
          )
        }

        {
          getReceiversCount !== '' &&(
            <View style={styles.containerCount}>
              <Text style={styles.textCount}>{getReceiversCount}</Text>
            </View>          )
        }


      </View>
      <ListItem.Content style={styles.titleSection}>
        <ListItem.Title style={styles.titleText} numberOfLines={1}>
          {getTitle}
        </ListItem.Title>
        <ListItem.Subtitle style={styles.subtitleText}>
          {formattedDateText}
        </ListItem.Subtitle>
      </ListItem.Content>

      <ListItem.Content style={styles.amountSection}>
        <LabeledBalanceDisplay
          balance={transaction.amount}
          bitcoinUnit={bitcoinUnit}
          currencyKind={currencyKind}
          amountTextStyle={amountTextStyle}
          currencyImageStyle={styles.bitcoinImage}
          iconSpacing={2}
          bitcoinIconColor="gray"
          textColor="gray"
          isTestAccount={transaction.accountType === AccountType.TEST_ACCOUNT}
        />
      </ListItem.Content>

      <ListItem.Content style={styles.confirmationsSection}>
        <ListItem.Subtitle style={styles.confirmationsText}>
          {confirmationsText}
        </ListItem.Subtitle>
      </ListItem.Content>
    </>
  )
}

const styles = StyleSheet.create( {
  transactionKindIcon: {
    marginRight: 14,
  },

  titleSection: {
    flex: 1,
  },

  containerImg: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 35,
    width: 35,
    marginRight: 10,
  },

  avatarImage: {
    height: 45,
    width: 45,
    // borderRadius: 10,
  },

  dot: {
    height: 9,
    width: 9,
    backgroundColor: 'tomato',
    borderRadius: 5,
    position: 'absolute',
    top: 0,
    right: 0,
  },

  textCount: {
    color: 'gray',
    fontSize: 10,
  },

  containerCount: {
    height: 20,
    width: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    position: 'absolute',
    bottom: 0,
    right: -2,
    justifyContent: 'center',
    elevation: 1,
    alignItems: 'center',
  },

  titleText: {
    color: Colors.blue,
    fontSize: RFValue( 12 ),
    marginBottom: 2,
  },

  subtitleText: {
    fontSize: RFValue( 10 ),
  },

  bitcoinImage: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
    alignSelf: 'center',
  },

  amountSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginLeft: 16,
  },

  confirmationsSection: {
    flex: 0,
    marginLeft: 4,
  },

  confirmationsText: {
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansRegular,
    fontSize: RFValue( 12 ),
    marginTop: RFValue( 4 ),
  },

  amountText: {
    fontFamily: Fonts.OpenSans,
    fontSize: RFValue( 17 ),
  },

} )

export default TransactionListItemContent
