import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { useSubmitExtrinsic } from '@/hooks/submitExtrinsic';

import { AmountInput, ProgressButton } from '@/components/Elements';
import { OrderCard } from '@/components/Orders';

import { useAccounts } from '@/contexts/account';
import { useRegionXApi, useRelayApi } from '@/contexts/apis';
import { ApiState } from '@/contexts/apis/types';
import { useOrders } from '@/contexts/orders';
import { useToast } from '@/contexts/toast';
import { Order, RELAY_ASSET_ID } from '@/models';

import styles from './index.module.scss';

interface ContributionModalProps {
  open: boolean;
  onClose: () => void;
  order: Order;
}

export const ContributionModal = ({
  open,
  onClose,
  order,
}: ContributionModalProps) => {
  const theme = useTheme();

  const {
    state: { activeAccount, activeSigner },
  } = useAccounts();
  const { fetchOrders } = useOrders();
  const {
    state: { symbol: relaySymbol, decimals: relayDecimals },
  } = useRelayApi();
  const {
    state: { api, apiState, symbol, decimals },
  } = useRegionXApi();
  const { toastInfo, toastError, toastWarning, toastSuccess } = useToast();
  const { submitExtrinsicWithFeeInfo } = useSubmitExtrinsic();

  const [working, setWorking] = useState(false);
  const [amount, setAmount] = useState(0);

  const onContribute = () => {
    if (!api || apiState !== ApiState.READY) {
      toastWarning('Please check the API connection');
      return;
    }

    if (!activeAccount || !activeSigner) {
      toastWarning('Please connect your wallet');
      return;
    }

    if (!amount) {
      toastWarning('Please input contribution amount');
      return;
    }

    try {
      const tx = api.tx.orders.contribute(
        order.orderId,
        Math.floor(amount * Math.pow(10, relayDecimals))
      );
      submitExtrinsicWithFeeInfo(
        symbol,
        decimals,
        tx,
        activeAccount.address,
        activeSigner,
        {
          ready: () => {
            setWorking(true);
            toastInfo('Transaction was initiated');
          },
          inBlock: () => toastInfo('In Block'),
          finalized: () => setWorking(false),
          success: () => {
            toastSuccess('Successfully contributed to the order');
            onClose();
            fetchOrders();
          },
          fail: () => {
            toastError('Failed to contribute to the order');
          },
          error: (e) => {
            toastError(`Failed to contribute to an order ${e}`);
            setWorking(false);
          },
        },
        RELAY_ASSET_ID
      );
    } catch (e: any) {
      setWorking(false);
      toastError(`Failed to contribute to the order. ${e.toString()}`);
    }
  };

  useEffect(() => {
    if (open) return;

    setWorking(false);
    setAmount(0);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className={styles.container}>
        <Box>
          <Typography
            variant='subtitle1'
            sx={{ color: theme.palette.common.black }}
          >
            Contribute to order
          </Typography>
          <Typography
            variant='subtitle2'
            sx={{ color: theme.palette.text.primary }}
          >
            Here you can contribute or cancel your contribution
          </Typography>
        </Box>
        <OrderCard order={order} direction='horizontal' />
        <Stack direction='column' gap='1rem'>
          <AmountInput
            amount={amount}
            currency={relaySymbol}
            caption='Contribution amount'
            setAmount={(value: number) => setAmount(value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='outlined'>
          Cancel
        </Button>

        <ProgressButton
          onClick={onContribute}
          label='Contribute'
          loading={working}
        />
      </DialogActions>
    </Dialog>
  );
};
