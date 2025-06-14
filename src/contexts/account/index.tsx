import type { Signer } from '@polkadot/api/types';
import { InjectedAccount, InjectedAccountWithMeta, InjectedAccounts, InjectedExtension } from '@polkadot/extension-inject/types';
import React, { createContext, useContext, useEffect, useReducer } from 'react';

import { isValidAddress } from '@/utils/functions';

import { APP_NAME } from '@/consts';
import useInitMimir from '@/components/Mimir/hook';

const LOCAL_STORAGE_ACCOUNTS = 'accounts';
const LOCAL_STORAGE_ACTIVE_ACCOUNT = 'active-account';

export enum WalletTypes {
  TALISMAN = 'talisman',
  POLKADOTJS = 'polkadot-js',
  SUBWALLET = 'subwallet',
  MIMIR = 'mimir',
}

export enum KeyringState {
  // eslint-disable-next-line no-unused-vars
  DISCONNECTED = 'disconnected',
  // eslint-disable-next-line no-unused-vars
  LOADING = 'loading',
  // eslint-disable-next-line no-unused-vars
  READY = 'ready',
  // eslint-disable-next-line no-unused-vars
  ERROR = 'error',
}

type State = {
  status: KeyringState;
  accounts: InjectedAccountWithMeta[];
  activeAccount: InjectedAccountWithMeta | null;
  activeSigner: Signer | null;
};

const initialState: State = {
  status: KeyringState.DISCONNECTED,
  accounts: [],
  activeAccount: null,
  activeSigner: null,
};

interface Props {
  children: React.ReactNode;
}

const reducer = (state: State, action: any) => {
  switch (action.type) {
    case 'LOAD_KEYRING':
      return { ...state, keyringState: KeyringState.LOADING };
    case 'KEYRING_READY':
      return { ...state, KeyringState: KeyringState.READY };
    case 'KEYRING_ERROR':
      return { ...state, keyring: null, keyringState: KeyringState.ERROR };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'SET_ACTIVE_ACCOUNT':
      return { ...state, activeAccount: action.payload };
    case 'SET_ACTIVE_SIGNER':
      return { ...state, activeSigner: action.payload } as State;
    case 'DISCONNECT':
      return {
        status: KeyringState.DISCONNECTED,
        accounts: [],
        activeAccount: null,
        activeSigner: null,
      } as State;
    default:
      throw new Error(`Unknown type: ${action.type}`);
  }
};

interface AccountData {
  state: State;
  setActiveAccount: (_acct: InjectedAccountWithMeta | null) => void;
  connectWallet: (injectedExtension: InjectedExtension) => void;
  disconnectWallet: () => void;
}

const defaultAccountData: AccountData = {
  state: initialState,
  setActiveAccount: (_acct: InjectedAccountWithMeta | null) => {
    /** */
  },
  connectWallet: () => {
    /** */
  },
  disconnectWallet: () => {
    /** */
  },
};

const AccountDataContext = createContext<AccountData>(defaultAccountData);

const AccountProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  useInitMimir();

  const setActiveAccount = (acct: InjectedAccountWithMeta | null) => {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_ACCOUNT, acct?.address || '');
    dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: acct });
  };

  const connectWallet = (injectedExtension: InjectedExtension) => {
    const asyncLoadAccounts = async () => {
      try {
        dispatch({ type: 'LOAD_KEYRING' });
        const accounts: InjectedAccounts = injectedExtension.accounts;
        console.log(injectedExtension);
        dispatch({ type: 'KEYRING_READY' });
        dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
      } catch (e) {
        dispatch({ type: 'KEYRING_ERROR' });
      }
    };
    asyncLoadAccounts();
  };

  const disconnectWallet = () => {
    localStorage.removeItem(LOCAL_STORAGE_ACCOUNTS);
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_ACCOUNT);
    dispatch({ type: 'DISCONNECT' });
  };

  useEffect(() => {
    const accounts = state.accounts;

    if (accounts.length) {
      const activeAccount = localStorage.getItem(LOCAL_STORAGE_ACTIVE_ACCOUNT);
      const account: InjectedAccountWithMeta = activeAccount
        ? (accounts.find((acc: any) => acc.address == activeAccount) ?? accounts[0])
        : accounts[0];

      setActiveAccount(account);
      localStorage.setItem(LOCAL_STORAGE_ACCOUNTS, JSON.stringify(accounts));
    }
  }, [state.accounts]);

  useEffect(() => {
    const getInjector = async () => {
      const activeAccount = state.activeAccount;
      if (!activeAccount) return;

      try {
        const { web3FromSource } = await import('@polkadot/extension-dapp');
        const injector = await web3FromSource(activeAccount.meta.source);
        console.log(activeAccount.meta.source);
        dispatch({ type: 'SET_ACTIVE_SIGNER', payload: injector.signer });
      } catch (e) {
        /** */
      }
    };
    getInjector();
  }, [state.activeAccount]);

  const validate = (jsonStr: string): boolean => {
    const items = JSON.parse(jsonStr);
    const len = items.length;

    if (len === 0 || len === undefined) return false;

    for (const item of items) {
      const keys = ['address', 'type', 'meta'];
      const metaKeys = ['genesisHash', 'name', 'source'];

      for (const key of keys) if (!Object.hasOwn(item, key)) return false;
      for (const key of Object.keys(item)) if (keys.indexOf(key) === -1) return false;

      if (!isValidAddress(item.address)) return false;

      if (!Object.hasOwn(item.meta, 'source')) return false;
      for (const key of Object.keys(item.meta)) if (metaKeys.indexOf(key) === -1) return false;
    }

    return true;
  };

  useEffect(() => {
    const asyncLoadAccounts = async () => {
      const { web3Enable } = await import('@polkadot/extension-dapp');
      await web3Enable(APP_NAME);

      const item = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS);
      if (!item) return;

      try {
        if (!validate(item)) return;
        const accounts = JSON.parse(item) as InjectedAccountWithMeta[];

        let injectCounter = 0;
        const injectedWeb3Interval = setInterval(() => {
          if (++injectCounter === 10) {
            clearInterval(injectedWeb3Interval);
          } else {
            // if injected is present
            const injectedWeb3 = (window as any)?.injectedWeb3 || null;
            if (injectedWeb3 !== null) {
              clearInterval(injectedWeb3Interval);

              dispatch({ type: 'KEYRING_READY' });
              dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
            }
          }
        }, 500);

        return () => {
          clearInterval(injectedWeb3Interval);
        };
      } catch {
        // error handling
      }
    };

    asyncLoadAccounts();
  }, []);

  return (
    <AccountDataContext.Provider
      value={{ state, setActiveAccount, connectWallet, disconnectWallet }}
    >
      {children}
    </AccountDataContext.Provider>
  );
};

const useAccounts = () => useContext(AccountDataContext);

export { AccountProvider, useAccounts };
