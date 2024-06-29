import { AddressOrPair, SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult, Signer } from '@polkadot/types/types';
import { useConfirm } from 'material-ui-confirm';

import { getBalanceString, sendTx } from '@/utils/functions';

import { NATIVE_ASSET_ID, TxStatusHandlers } from '@/models';
import { numberToU8a } from '@polkadot/util';

export const useSubmitExtrinsic = () => {
  const confirm = useConfirm();

  const submitExtrinsicWithFeeInfo = async (
    symbol: string,
    decimals: number,
    tx: SubmittableExtrinsic<'promise', ISubmittableResult>,
    account: AddressOrPair,
    signer: Signer,
    handlers: TxStatusHandlers,
    feePaymentAsset: number = NATIVE_ASSET_ID
  ) => {
    console.log(feePaymentAsset);
    const info = await tx.paymentInfo(
      account.toString(),
      feePaymentAsset == NATIVE_ASSET_ID ? {} : { assetId: numberToU8a(feePaymentAsset) }
    );
    const { partialFee } = info.toPrimitive() as any;
    confirm({
      description: `Estimated gas fee: ${getBalanceString(
        partialFee.toString(),
        decimals,
        symbol
      )}`,
    }).then(() => sendTx(tx, account, signer, handlers, feePaymentAsset));
  };

  return { submitExtrinsicWithFeeInfo };
};
