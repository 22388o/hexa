import { TrustedContact, UnecryptedStreamData, UnecryptedStreams } from '../../../bitcoin/utilities/Interface'
import TrustedContacts from '../../../bitcoin/utilities/TrustedContacts'

export default function useStreamFromContact(
  contact: TrustedContact,
  walletId: string,
  instream?: boolean
): UnecryptedStreamData {
  const usersStreamId = TrustedContacts.getStreamId( walletId )
  const channel: UnecryptedStreams = contact.unencryptedPermanentChannel

  if( instream ){
    // return counterparty's stream(instream from user's perspective)
    for( const streamId of Object.keys( channel ) ){
      if( usersStreamId !== streamId ) return channel[ streamId ]
    }
  } else return channel[ usersStreamId ] // return user's stream(outstream from user's perspective)
}
