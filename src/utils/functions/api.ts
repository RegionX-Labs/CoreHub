import { AddressOrPair, SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult, Signer } from '@polkadot/types/types';

import { NATIVE_ASSET_ID, TxStatusHandlers } from '@/models';
import { numberToU8a } from '@polkadot/util';

export const sendTx = async (
  tx: SubmittableExtrinsic<'promise', ISubmittableResult>,
  account: AddressOrPair,
  signer: Signer,
  handlers: TxStatusHandlers,
  feePaymentAsset: number = NATIVE_ASSET_ID
) => {
  const options =
    feePaymentAsset == NATIVE_ASSET_ID
      ? { signer }
      : { signer, assetId: numberToU8a(feePaymentAsset) };
  console.log(options);
  try {
    const unsub = await tx.signAndSend(
      account,
      options,
      ({ status, events }) => {
        if (status.isReady) handlers.ready();
        else if (status.isInBlock) handlers.inBlock();
        else if (status.isFinalized) {
          handlers.finalized();
          events.forEach(({ event: { method } }) => {
            if (method === 'ExtrinsicSuccess') {
              handlers.success();
            } else if (method === 'ExtrinsicFailed') {
              handlers.fail();
            }
          });
          unsub();
        }
      }
    );
  } catch (e) {
    handlers.error(e);
  } finally {
    handlers.finally && handlers.finally();
  }
};
