import {
  Backdrop,
  Box,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import { useState } from 'react';

import { sendTx } from '@/utils/functions';
import { getCorePriceAt } from '@/utils/sale';

import {
  Balance,
  CoreDetailsPanel,
  ProgressButton,
  SaleInfoPanel,
  SalePhaseInfoPanel,
} from '@/components';

import { useAccounts } from '@/contexts/account';
import { useCoretimeApi } from '@/contexts/apis';
import { ApiState } from '@/contexts/apis/types';
import { useBalances } from '@/contexts/balance';
import { useNetwork } from '@/contexts/network';
import { useRegions } from '@/contexts/regions';
import { useSaleInfo } from '@/contexts/sales';
import { useToast } from '@/contexts/toast';
import { ContextStatus, SalePhase } from '@/models';

const Purchase = () => {
  const theme = useTheme();

  const [working, setWorking] = useState(false);
  TimeAgo.addLocale(en);
  // Create formatter (English).

  const {
    state: { activeSigner, activeAccount },
  } = useAccounts();
  const { toastError, toastSuccess, toastInfo, toastWarning } = useToast();

  const { network } = useNetwork();
  const {
    saleInfo,
    status,
    phase: { currentPhase, saleStartTimestamp, saleEndTimestamp, endpoints },
  } = useSaleInfo();
  const {
    state: { api, apiState, height },
  } = useCoretimeApi();

  const { fetchRegions } = useRegions();

  const { balance } = useBalances();

  const getCurrentPrice = (): number => {
    if (status !== ContextStatus.LOADED) return 0;

    const at =
      currentPhase === SalePhase.Interlude ? saleInfo.saleStart : height;
    const price = getCorePriceAt(at, saleInfo, network);
    return price;
  };

  const currentPrice = getCurrentPrice();

  const purchase = async () => {
    if (!api || apiState !== ApiState.READY || !activeAccount || !activeSigner)
      return;

    if (currentPhase === SalePhase.Interlude) {
      toastWarning(
        'Sales start after the interlude period ends. Purchases can then be made.'
      );
      return;
    }

    const txPurchase = api.tx.broker.purchase(currentPrice);

    setWorking(true);
    sendTx(txPurchase, activeAccount.address, activeSigner, {
      ready: () => toastInfo('Transaction was initiated'),
      inBlock: () => toastInfo(`In Block`),
      finalized: () => setWorking(false),
      success: () => {
        toastSuccess('Transaction successful');
        fetchRegions();
      },
      error: () => {
        toastError(`Failed to purchase a region`);
      },
    });
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography
            variant='subtitle1'
            sx={{ color: theme.palette.common.black }}
          >
            Purchase a core
          </Typography>
          <Typography
            variant='subtitle2'
            sx={{ color: theme.palette.text.primary }}
          >
            Buy a core straight from the Coretime chain
          </Typography>
        </Box>
        <Balance
          coretimeBalance={balance.coretime}
          relayBalance={balance.relay}
        />
      </Box>
      <Box>
        {status !== ContextStatus.LOADED ? (
          <Backdrop open>
            <CircularProgress />
          </Backdrop>
        ) : (
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <SaleInfoPanel
              currentPhase={currentPhase}
              saleStartTimestamp={saleStartTimestamp}
              saleEndTimestamp={saleEndTimestamp}
              floorPrice={saleInfo.price}
              currentPrice={currentPrice}
            />
            <Box sx={{ display: 'flex', gap: '1rem' }}>
              <CoreDetailsPanel saleInfo={saleInfo} />
              <SalePhaseInfoPanel
                currentPhase={currentPhase}
                endpoints={endpoints}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
              }}
            >
              <ProgressButton
                onClick={purchase}
                loading={working}
                label='Purchase Core'
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Purchase;
