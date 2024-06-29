import React, { useContext, useEffect, useReducer } from 'react';

import { EXPERIMENTAL, WS_REGIONX_COCOS_CHAIN } from '@/consts';
import { useNetwork } from '@/contexts/network';
import { useToast } from '@/contexts/toast';
import { NetworkType } from '@/models';

import { connect, disconnect, initialState, reducer } from '../common';
import { ApiState } from '../types';

const types = {
  CoreIndex: 'u32',
  CoreMask: 'Vec<u8>',
  Timeslice: 'u32',
  RegionId: {
    begin: 'Timeslice',
    core: 'CoreIndex',
    mask: 'CoreMask',
  },
  RegionRecord: {
    end: 'Timeslice',
    owner: 'AccountId',
    paid: 'Option<Balance>',
  },
  HashAlgorithm: {
    _enum: ['Keccak', 'Blake2'],
  },
  StateMachineProof: {
    hasher: 'HashAlgorithm',
    storage_proof: 'Vec<Vec<u8>>',
  },
  SubstrateStateProof: {
    _enum: {
      OverlayProof: 'StateMachineProof',
      StateProof: 'StateMachineProof',
    },
  },
  LeafIndexQuery: {
    commitment: 'H256',
  },
  StateMachine: {
    _enum: {
      Ethereum: {},
      Polkadot: 'u32',
      Kusama: 'u32',
    },
  },
  Post: {},
  Get: {
    source: 'StateMachine',
    dest: 'StateMachine',
    nonce: 'u64',
    from: 'Vec<u8>',
    keys: 'Vec<Vec<u8>>',
    height: 'u64',
    timeout_timestamp: 'u64',
  },
  Request: {
    _enum: {
      Post: 'Post',
      Get: 'Get',
    },
  },
};

const customRpc = {
  ismp: {
    queryRequests: {
      description: '',
      params: [
        {
          name: 'query',
          type: 'Vec<LeafIndexQuery>',
        },
      ],
      type: 'Vec<Request>',
    },
  },
};

const signedExtensions = {
  ChargeAssetTxPayment: {
    extrinsic: {
      tip: 'Compact<Balance>',
      assetId: 'Option<AssetId>',
    },
    payload: {},
  },
};

const defaultValue = {
  state: { ...initialState },
  disconnectRegionX: (): void => {
    /** */
  },
};

const RegionXApiContext = React.createContext(defaultValue);

const RegionXApiContextProvider = (props: any) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { toastError } = useToast();
  const { network } = useNetwork();

  useEffect(() => {
    state.apiState === ApiState.ERROR &&
      toastError(`Failed to connect to RegionX chain`);
  }, [state.apiState, toastError]);

  const disconnectRegionX = () => disconnect(state);

  useEffect(() => {
    if (network !== NetworkType.ROCOCO && !EXPERIMENTAL) {
      return;
    }
    // TODO: currently we use the RegionX chain only when the experimental flag is on.
    //
    // For this reason we don't have different urls based on the network. However, this
    // should be updated once this is in production.
    connect(
      state,
      WS_REGIONX_COCOS_CHAIN,
      dispatch,
      false,
      types,
      customRpc,
      signedExtensions
    );
  }, [network, state]);

  useEffect(() => {
    dispatch({ type: 'DISCONNECTED' });
  }, [network]);

  return (
    <RegionXApiContext.Provider value={{ state, disconnectRegionX }}>
      {props.children}
    </RegionXApiContext.Provider>
  );
};

const useRegionXApi = () => useContext(RegionXApiContext);

export { RegionXApiContextProvider, useRegionXApi };
