import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Slider,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useInkathon } from '@scio-labs/use-inkathon';
import { useEffect, useState } from 'react';

import { binMask2Strinng, mask2BinString } from '@/utils/functions';

import { RegionCard } from '@/components/elements';

import { useCoretimeApi } from '@/contexts/apis';
import { useRegions } from '@/contexts/regions';
import { useToast } from '@/contexts/toast';
import { RegionMetadata } from '@/models';

import styles from './index.module.scss';

interface InterlaceModalProps {
  open: boolean;
  onClose: () => void;
  region: RegionMetadata;
}

export const InterlaceModal = ({
  open,
  onClose,
  region,
}: InterlaceModalProps) => {
  const theme = useTheme();
  const { activeAccount, activeSigner } = useInkathon();

  const {
    state: { api },
  } = useCoretimeApi();
  const { toastError, toastSuccess, toastInfo } = useToast();
  const {
    fetchRegions,
    config: { timeslicePeriod },
  } = useRegions();

  const currentMask = mask2BinString(region.mask);
  const oneStart = currentMask.indexOf('1');
  const oneEnd = currentMask.lastIndexOf('1');
  const activeBits = oneEnd - oneStart + 1;

  const [working, setWorking] = useState(false);
  const [position, setPosition] = useState(oneStart);

  const generateMask = (position: number): string => {
    const mask = Array(timeslicePeriod).fill('0');
    for (let i = oneStart; i <= position; ++i) mask[i] = '1';
    return mask.join('');
  };

  const newMask = generateMask(position);

  const onInterlace = async () => {
    if (!api || !activeAccount || !activeSigner) return;

    const mask = binMask2Strinng(newMask);

    const txInterlace = api.tx.broker.interlace(region.rawId, mask);
    try {
      setWorking(true);
      await txInterlace.signAndSend(
        activeAccount.address,
        { signer: activeSigner },
        ({ status, events }) => {
          if (status.isReady) toastInfo('Transaction was initiated');
          else if (status.isInBlock) toastInfo(`In Block`);
          else if (status.isFinalized) {
            setWorking(false);
            events.forEach(({ event: { method } }) => {
              if (method === 'ExtrinsicSuccess') {
                toastSuccess('Transaction successful');
                onClose();
                fetchRegions();
              } else if (method === 'ExtrinsicFailed') {
                toastError(`Failed to interlace the region`);
              }
            });
          }
        }
      );
    } catch (e) {
      toastError(`Failed to interlace the region. ${e}`);
      setWorking(false);
    }
  };

  useEffect(() => {
    setPosition(oneStart);
  }, [open, oneStart]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md'>
      <DialogContent>
        <Stack direction='column' gap={3}>
          <RegionCard region={region} bordered={false} />
          <Stack direction='column' gap={2}>
            <Typography
              variant='h2'
              sx={{ color: theme.palette.text.secondary }}
            >
              Current Mask:
            </Typography>
            <Typography>{currentMask}</Typography>
          </Stack>
          {activeBits > 1 && (
            <Stack direction='column' gap={2}>
              <Box display="flex" justifyContent="center">
                <CoremaskCircularProgress position={position} oneStart={oneStart} oneEnd={oneEnd} />
              </Box>
              <Slider
                min={oneStart}
                max={oneEnd - 1}
                step={1}
                value={position}
                onChange={(_e, v) => setPosition(Number(v))}
                valueLabelDisplay='on'
                valueLabelFormat={(v) =>
                  `${(((v - oneStart + 1) / timeslicePeriod) * 100).toFixed(
                    2
                  )}%`
                }
                className={styles.slider}
              />
              <Typography
                variant='h2'
                sx={{ color: theme.palette.text.secondary }}
              >
                New Mask:
              </Typography>

              <Typography>{newMask}</Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <LoadingButton
          onClick={onInterlace}
          variant='contained'
          loading={working}
          disabled={activeBits === 1}
        >
          Interlace
        </LoadingButton>
        <Button onClick={onClose} variant='outlined'>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface CoremaskCircularProgressProps {
  position: number;
  oneStart: number,
  oneEnd: number;
}

const CoremaskCircularProgress = ({ position, oneStart, oneEnd }: CoremaskCircularProgressProps) => {
  const getCircularProgressValue = (value: number, minValue: number, maxValue: number) => {
    return ((value - minValue) / (maxValue - minValue)) * 100;
  };

  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress
        className={styles.circular}
        size="250px"
        variant="determinate"
        value={100}
        style={{ position: 'absolute', color: '#d3d3d3' }} // Secondary color
      />
      <CircularProgress
        className={styles.circular}
        size="250px"
        variant="determinate"
        value={getCircularProgressValue(position, oneStart, oneEnd)}
      />
    </Box>
  );
}
