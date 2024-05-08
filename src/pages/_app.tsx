import { CacheProvider, EmotionCache } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Analytics } from '@vercel/analytics/react';
import { NextPage } from 'next';
import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import * as React from 'react';
import '../../styles/global.scss';

import createEmotionCache from '@/utils/createEmotionCache';
import theme from '@/utils/muiTheme';

import { Layout } from '@/components';

import {
  CoretimeApiContextProvider,
  RelayApiContextProvider,
} from '@/contexts/apis';
import { BalanceProvider } from '@/contexts/balance';
import { ContextDataProvider } from '@/contexts/common';
import { MarketProvider } from '@/contexts/market';
import { NetworkProvider } from '@/contexts/network';
import { RegionDataProvider } from '@/contexts/regions';
import { SaleInfoProvider } from '@/contexts/sales';
import { TaskDataProvider } from '@/contexts/tasks';
import { ToastProvider } from '@/contexts/toast';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();
export type NextPageWithLayout<P = unknown, IP = P> = NextPage<P, IP> & {
  getLayout?: (_page: React.ReactElement) => React.ReactNode;
};
interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
  Component: NextPageWithLayout;
}

const AccountProvider = dynamic(
  () => import('../contexts/account').then((a) => a.AccountProvider),
  { ssr: false }
);

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
        <title>CoreHub</title>
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <NetworkProvider>
            <AccountProvider>
              <CoretimeApiContextProvider>
                <RelayApiContextProvider>
                  <BalanceProvider>
                    <ContextDataProvider>
                      <TaskDataProvider>
                        <RegionDataProvider>
                          <MarketProvider>
                            <SaleInfoProvider>
                              {getLayout(<Component {...pageProps} />)}
                            </SaleInfoProvider>
                          </MarketProvider>
                        </RegionDataProvider>
                      </TaskDataProvider>
                    </ContextDataProvider>
                  </BalanceProvider>
                </RelayApiContextProvider>
              </CoretimeApiContextProvider>
            </AccountProvider>
          </NetworkProvider>
        </ToastProvider>
      </ThemeProvider>
      <Analytics />
    </CacheProvider>
  );
}
