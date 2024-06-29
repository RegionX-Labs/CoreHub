///
// Initial state for `useReducer`

import { ApiPromise, WsProvider } from '@polkadot/api';
import jsonrpc from '@polkadot/types/interfaces/jsonrpc';
import { Codec, DefinitionRpcExt } from '@polkadot/types/types';

import { ApiState } from './types';

export type State = {
  jsonrpc: Record<string, Record<string, DefinitionRpcExt>>;
  api: ApiPromise | null;
  socket: string;
  apiError: any;
  apiState: ApiState;
  symbol: string;
  name: string;
  decimals: number;
  height: number;
  timestamp: number;
};

export const initialState: State = {
  // These are the states
  jsonrpc: { ...jsonrpc },
  api: null,
  socket: '',
  apiError: null,
  apiState: ApiState.DISCONNECTED,
  symbol: '',
  name: '',
  decimals: 0,
  height: 0,
  timestamp: 0,
};

///
// Reducer function for `useReducer`

export const reducer = (state: any, action: any) => {
  switch (action.type) {
    case 'CONNECT_INIT':
      return {
        ...state,
        socket: action.socket,
        apiState: ApiState.CONNECT_INIT,
      };
    case 'CONNECT':
      return {
        ...state,
        socket: action.socket,
        api: action.payload,
        apiState: ApiState.CONNECTING,
      };
    case 'CONNECT_SUCCESS':
      return {
        ...state,
        apiState: ApiState.READY,
        height: 0,
        timestamp: 0,
      };
    case 'CONNECT_ERROR':
      return { ...state, apiState: ApiState.ERROR, apiError: action.payload };
    case 'DISCONNECTED':
      return {
        ...state,
        api: null,
        apiState: ApiState.DISCONNECTED,
        symbol: '',
        name: '',
        height: 0,
        timestamp: 0,
      };
    case 'SET_SYMBOL':
      return { ...state, symbol: action.payload };
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_DECIMALS':
      return { ...state, decimals: action.payload };
    case 'SET_HEIGHT':
      return { ...state, height: action.payload };
    case 'SET_TIMESTAMP':
      return { ...state, timestamp: action.payload };
    default:
      throw new Error(`Unknown type: ${action.type}`);
  }
};

// Connecting to the Substrate node

export const connect = (
  state: any,
  socket: string,
  dispatch: any,
  newSocket: boolean,
  types?: any,
  customRpc?: any,
  signedExtensions?: any
) => {
  const { apiState, jsonrpc } = state;

  // We only want this function to be performed once
  if (apiState !== ApiState.DISCONNECTED && !newSocket) return;

  const provider = new WsProvider(socket);
  const _api = new ApiPromise({
    provider,
    rpc: { ...jsonrpc, ...customRpc },
    types,
    signedExtensions,
  });
  dispatch({ type: 'CONNECT_INIT', socket });

  let unsubHeight: any, unsubTimestamp: any;

  // Set listeners for disconnection and reconnection event.
  _api.on('connected', () => {
    dispatch({ type: 'CONNECT', payload: _api, socket });
    // `ready` event is not emitted upon reconnection and is checked explicitly here.
    _api.isReady.then(() => dispatch({ type: 'CONNECT_SUCCESS' }));
  });
  _api.on('ready', async () => {
    try {
      dispatch({ type: 'CONNECT_SUCCESS' });

      const chainInfo = _api.registry.getChainProperties();
      if (chainInfo) {
        const { tokenDecimals, tokenSymbol } = chainInfo.toHuman() as any;
        dispatch({
          type: 'SET_SYMBOL',
          payload: tokenSymbol ? tokenSymbol[0] : 'UNIT',
        });
        dispatch({
          type: 'SET_DECIMALS',
          payload: tokenDecimals ? parseInt(tokenDecimals[0]) : 12,
        });
      }

      const name = (await _api.rpc.system.chain()).toString();
      dispatch({
        type: 'SET_NAME',
        payload: name,
      });

      unsubHeight = await _api.query.system.number((height: Codec) =>
        dispatch({
          type: 'SET_HEIGHT',
          payload: height.toJSON() as number,
        })
      );
      unsubTimestamp = await _api.query.timestamp.now((moment: Codec) =>
        dispatch({
          type: 'SET_TIMESTAMP',
          payload: moment.toJSON() as number,
        })
      );
    } catch {
      /** empty error handler */
    }
  });
  _api.on('error', (err) => {
    dispatch({ type: 'CONNECT_ERROR', payload: err });
  });
  _api.on('disconnected', () => {
    try {
      if (unsubHeight) unsubHeight();
      if (unsubTimestamp) unsubTimestamp();
      dispatch({ type: 'DISCONNECTED' });
    } catch {
      /** empty error handler */
    }
  });
};

export const disconnect = (state: any) => {
  const { api, apiState } = state;
  if (!api || apiState === ApiState.DISCONNECTED) return;
  try {
    api.disconnect();
  } catch {
    /** empty error handler */
  }
};
