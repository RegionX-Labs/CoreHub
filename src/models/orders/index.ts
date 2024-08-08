import { Timeslice } from 'coretime-utils';

import { Address, ParaId } from '../common';

type PartsOf57600 = number;

export type Requirements = {
  begin: Timeslice;
  end: Timeslice;
  coreOccupancy: PartsOf57600;
};

export type OnChainOrder = {
  creator: Address;
  paraId: ParaId;
  requirements: Requirements;
};

export type Order = OnChainOrder & {
  orderId: number;
  totalContribution: number;
  contribution: number;
};

export type OrderItem = {
  orderId: number;
  extrinsicId: string;
  account: string;
  reward: number;
  timestamp: Date;
};
