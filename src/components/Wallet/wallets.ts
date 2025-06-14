import { InjectedExtension, InjectedWindow } from "@polkadot/extension-inject/types";

export type SubstrateWallet = {
  id: string;
  name: string;
  urls: {
    website: string;
    chromeExtension: string;
    firefoxExtension: string;
  },
  logoUrls: Array<string>;
}

export const polkadotjs: SubstrateWallet = {
  id: 'polkadot-js',
  name: 'Polkadot{.js}',
  urls: {
    website: 'https://polkadot.js.org/extension/',
    chromeExtension:
      'https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/mopnmbcafieddcagagdcbnhejhlodfdd',
    firefoxExtension: 'https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/',
  },
  logoUrls: [
    'https://github.com/scio-labs/use-inkathon/raw/main/assets/wallet-logos/polkadot@128w.png',
    'https://github.com/scio-labs/use-inkathon/raw/main/assets/wallet-logos/polkadot@512w.png',
  ],
}

export const subwallet: SubstrateWallet = {
  id: 'subwallet-js',
  name: 'SubWallet',
  urls: {
    website: 'https://subwallet.app/',
    chromeExtension:
      'https://chrome.google.com/webstore/detail/subwallet-polkadot-extens/onhogfjeacnfoofkfgppdlbmlmnplgbn',
    firefoxExtension: 'https://addons.mozilla.org/en-US/firefox/addon/subwallet/',
  },
  logoUrls: [
    'https://github.com/scio-labs/use-inkathon/raw/main/assets/wallet-logos/subwallet@128w.png',
    'https://github.com/scio-labs/use-inkathon/raw/main/assets/wallet-logos/subwallet@512w.png',
  ],
}

export const talisman: SubstrateWallet = {
  id: 'talisman',
  name: 'Talisman',
  urls: {
    website: 'https://www.talisman.xyz/',
    chromeExtension:
      'https://chrome.google.com/webstore/detail/talisman-polkadot-wallet/fijngjgcjhjmmpcmkeiomlglpeiijkld',
    firefoxExtension: 'https://addons.mozilla.org/en-US/firefox/addon/talisman-wallet-extension/',
  },
  logoUrls: [
    'https://github.com/scio-labs/use-inkathon/raw/main/assets/wallet-logos/talisman@128w.png',
    'https://github.com/scio-labs/use-inkathon/raw/main/assets/wallet-logos/talisman@512w.png',
  ],
}

export const isWalletInstalled = (wallet: SubstrateWallet) => {
  try {
    if (typeof window === 'undefined') return undefined
    const injectedWindow = window as Window & InjectedWindow
    const injectedExtension = injectedWindow?.injectedWeb3?.[wallet.id]

    return !!injectedExtension
  } catch (e) {
    return undefined
  }
}

export const enableWallet = async (wallet: SubstrateWallet, appName: string) => {
  if (!isWalletInstalled(wallet)) return undefined

  try {
    if (typeof window === 'undefined') return undefined
    // @ts-ignore
    const injectedWindow = window as InjectedWindow;

    const injectedWindowProvider =
      injectedWindow?.injectedWeb3?.[wallet.id]
    if (!injectedWindowProvider?.enable)
      throw new Error('No according `InjectedWindowProvider` found.')

    const injected = await injectedWindowProvider.enable(appName);
    const injectedExtension: InjectedExtension = {
      ...injected,
      name: wallet.id,
      version: injectedWindowProvider.version || '',
    }
    return injectedExtension;
  } catch (e) {
    console.error('Error while enabling wallet', e)
    return undefined
  }
}
