///
// Initial state for `useReducer`

import { ApiPromise, WsProvider } from '@polkadot/api';
import jsonrpc from '@polkadot/types/interfaces/jsonrpc';
import { DefinitionRpcExt } from '@polkadot/types/types';

import { ApiState } from './types';

export type State = {
  jsonrpc: Record<string, Record<string, DefinitionRpcExt>>;
  api: ApiPromise | null;
  socket: string;
  apiError: any;
  apiState: ApiState;
  symbol: string;
  name: string;
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
      return { ...state, apiState: ApiState.READY };
    case 'CONNECT_ERROR':
      return { ...state, apiState: ApiState.ERROR, apiError: action.payload };
    case 'DISCONNECTED':
      return {
        ...state,
        apiState: ApiState.DISCONNECTED,
        symbol: '',
        name: '',
      };
    case 'SET_SYMBOL':
      return { ...state, symbol: action.payload };
    case 'SET_NAME':
      return { ...state, name: action.payload };
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
) => {
  const { apiState, jsonrpc } = state;

  // We only want this function to be performed once
  if (apiState !== ApiState.DISCONNECTED && !newSocket) return;

  const provider = new WsProvider(socket);
  const _api = new ApiPromise({ provider, rpc: { ...jsonrpc, ...customRpc }, types });
  dispatch({ type: 'CONNECT_INIT', socket });

  // Set listeners for disconnection and reconnection event.
  _api.on('connected', () => {
    dispatch({ type: 'CONNECT', payload: _api, socket });
    // `ready` event is not emitted upon reconnection and is checked explicitly here.
    _api.isReady.then(() => dispatch({ type: 'CONNECT_SUCCESS' }));
  });
  _api.on('ready', async () => {
    dispatch({ type: 'CONNECT_SUCCESS' });
    const chainInfo = _api.registry.getChainProperties();
    if (chainInfo?.tokenSymbol.isSome) {
      const [symbol] = chainInfo.tokenSymbol.toHuman() as [string];
      dispatch({
        type: 'SET_SYMBOL',
        payload: symbol,
      });
    }

    const name = await _api.rpc.system.chain();
    dispatch({
      type: 'SET_NAME',
      payload: name,
    });
  });
  _api.on('error', (err) => dispatch({ type: 'CONNECT_ERROR', payload: err }));
  _api.on('disconnected', () => dispatch({ type: 'DISCONNECTED' }));
};

export const disconnect = (state: any) => {
  const { api, apiState } = state;
  if (!api || apiState === ApiState.DISCONNECTED) return;
  api.disconnect();
};
