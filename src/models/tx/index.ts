import { Signer } from '@polkadot/types/types';

export type Sender = {
  address: string;
  signer: Signer;
};

export type TxStatusHandlers = {
  ready: () => void;
  inBlock: () => void;
  finalized: () => void;
  success: () => void;
  fail: () => void;
  error: (_: any) => void;
  finally?: () => void;
};
