import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { useSubmitExtrinsic } from '@/hooks/submitExtrinsic';

import { ProgressButton } from '@/components/Elements';
import { ParaDisplay } from '@/components/Paras';

import { chainData } from '@/chaindata';
import { useAccounts } from '@/contexts/account';
import { useRegionXApi } from '@/contexts/apis';
import { ApiState } from '@/contexts/apis/types';
import { useNetwork } from '@/contexts/network';
import { useOrders } from '@/contexts/orders';
import { useSaleInfo } from '@/contexts/sales';
import { useToast } from '@/contexts/toast';

import styles from './index.module.scss';
import { RELAY_ASSET_ID } from '@/models';

interface OrderCreationModalProps {
  open: boolean;
  onClose: () => void;
}

// eslint-disable-next-line no-unused-vars
enum DurationType {
  // eslint-disable-next-line no-unused-vars
  BULK = 0,
  // eslint-disable-next-line no-unused-vars
  CUSTOM = 1,
}

export const OrderCreationModal = ({
  open,
  onClose,
}: OrderCreationModalProps) => {
  const theme = useTheme();

  const {
    state: { activeAccount, activeSigner },
  } = useAccounts();
  const {
    state: { api, apiState, symbol, decimals },
  } = useRegionXApi();
  const { saleInfo } = useSaleInfo();

  const { network } = useNetwork();
  const { fetchOrders } = useOrders();
  const { toastInfo, toastError, toastWarning, toastSuccess } = useToast();
  const { submitExtrinsicWithFeeInfo } = useSubmitExtrinsic();

  const [paraId, setParaId] = useState<number | undefined>();
  const [regionBegin, setRegionBegin] = useState<number | undefined>();
  const [regionEnd, setRegionEnd] = useState<number | undefined>();
  const [coreOccupancy, setCoreOccupancy] = useState(57600);
  const [working, setWorking] = useState(false);
  const [durationType, setDurationType] = useState<DurationType>(
    DurationType.BULK
  );

  const onCreate = async () => {
    if (!api || apiState !== ApiState.READY) {
      toastWarning('Please check the API connection');
      return;
    }

    if (!activeAccount || !activeSigner) {
      toastWarning('Please connect your wallet');
      return;
    }

    if (paraId === undefined) {
      toastWarning('Please select a para id');
      return;
    }

    if (regionBegin === undefined) {
      toastWarning('Please input region begin');
      return;
    }

    if (regionEnd === undefined) {
      toastWarning('Please input region end');
      return;
    }

    if (coreOccupancy === 0) {
      toastWarning('Core occupany should be greater than 0');
      return;
    }

    try {
      const tx = api.tx.orders.createOrder(paraId, {
        begin: regionBegin,
        end: regionEnd,
        coreOccupancy,
      });

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
            toastSuccess('Successfully created a new order');
            onClose();
            fetchOrders();
          },
          fail: () => {
            toastError('Failed to create a new order');
          },
          error: (e) => {
            toastError(`Failed to create a new order ${e}`);
            setWorking(false);
          },
        },
        RELAY_ASSET_ID
      );
    } catch (e: any) {
      toastError(`Failed to create a new order. ${e.toString()}`);
      setWorking(false);
    }
  };

  useEffect(() => {
    if (open) return;
    setParaId(undefined);
    setDurationType(DurationType.BULK);
    setRegionBegin(undefined);
    setRegionEnd(undefined);
    setCoreOccupancy(57600);
    setWorking(false);
  }, [open]);

  useEffect(() => {
    if (durationType === DurationType.BULK) {
      setRegionBegin(saleInfo.regionBegin);
      setRegionEnd(saleInfo.regionEnd);
    } else {
      setRegionBegin(undefined);
      setRegionEnd(undefined);
    }
  }, [durationType, saleInfo]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md'>
      <DialogContent className={styles.container}>
        <Box>
          <Typography
            variant='subtitle1'
            sx={{ color: theme.palette.common.black }}
          >
            Create Order
          </Typography>
          <Typography
            variant='subtitle2'
            sx={{ color: theme.palette.text.primary }}
          >
            Create a new order here
          </Typography>
        </Box>
        <Stack>
          <Typography>Select a para ID</Typography>
          <FormControl fullWidth sx={{ mt: '1rem' }}>
            <InputLabel id='label-parachain-select'>Para ID</InputLabel>
            <Select
              sx={{ borderRadius: '1rem' }}
              labelId='label-parachain-select'
              label='Parachain'
              value={paraId || ''}
              onChange={(e) => setParaId(Number(e.target.value))}
              disabled={working}
            >
              {Object.keys(chainData[network]).map((paraId, index: number) => (
                <MenuItem key={index} value={paraId}>
                  <ParaDisplay network={network} paraId={Number(paraId)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <Typography>Region duration:</Typography>
        <Stack sx={{ padding: '1rem', bgcolor: '#EFF0F3' }} gap='1rem'>
          <FormControl>
            <ToggleButtonGroup
              value={durationType}
              exclusive
              onChange={(e: any) =>
                setDurationType(parseInt(e.target.value) as DurationType)
              }
              className={styles.durationTypes}
            >
              <ToggleButton
                className={
                  durationType === DurationType.BULK
                    ? styles.activeOption
                    : styles.option
                }
                value={DurationType.BULK}
              >
                Entire bulk period
              </ToggleButton>
              <ToggleButton
                className={
                  durationType === DurationType.CUSTOM
                    ? styles.activeOption
                    : styles.option
                }
                value={DurationType.CUSTOM}
              >
                Custom period
              </ToggleButton>
            </ToggleButtonGroup>
          </FormControl>
          {durationType === DurationType.CUSTOM && (
            <Stack direction='row' gap='1rem'>
              <Stack direction='column' gap='0.5rem'>
                <Typography sx={{ color: theme.palette.common.black }}>
                  Begin:
                </Typography>
                <TextField
                  value={regionBegin?.toString() || ''}
                  type='number'
                  onChange={(e) => setRegionBegin(parseInt(e.target.value))}
                  InputProps={{ style: { borderRadius: '1rem' } }}
                  disabled={working}
                />
              </Stack>
              <Stack direction='column' gap='0.5rem'>
                <Typography sx={{ color: theme.palette.common.black }}>
                  End:
                </Typography>
                <TextField
                  value={regionEnd?.toString() || ''}
                  type='number'
                  onChange={(e) => setRegionEnd(parseInt(e.target.value))}
                  InputProps={{ style: { borderRadius: '1rem' } }}
                  disabled={working}
                />
              </Stack>
            </Stack>
          )}
        </Stack>
        <Stack direction='column' gap='0.5rem'>
          <Typography>Core Occupancy:</Typography>
          <Slider
            disabled={working}
            value={coreOccupancy}
            max={57600}
            onChange={(_: Event, newValue: number | number[]) =>
              setCoreOccupancy(newValue as number)
            }
            valueLabelDisplay='on'
            valueLabelFormat={(value) =>
              `${((value / 57600) * 100).toFixed(0)} %`
            }
            step={576}
            sx={{ width: '90%', margin: '0 auto', mt: '0.5rem' }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='outlined'>
          Cancel
        </Button>

        <ProgressButton onClick={onCreate} label='Create' loading={working} />
      </DialogActions>
    </Dialog>
  );
};
