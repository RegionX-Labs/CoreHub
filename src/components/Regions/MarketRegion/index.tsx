import AccessTimeIcon from '@mui/icons-material/AccessTime';
import {
  Box,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { ApiPromise } from '@polkadot/api';
import { humanizer } from 'humanize-duration';
import TimeAgo from 'javascript-time-ago';
// English.
import en from 'javascript-time-ago/locale/en';
import React, { useCallback, useEffect, useState } from 'react';

import { getBalanceString, timesliceToTimestamp } from '@/utils/functions';

import { useCoretimeApi, useRelayApi } from '@/contexts/apis';
import { ApiState } from '@/contexts/apis/types';
import { Listing } from '@/models';

import styles from './index.module.scss';

interface MarketRegionProps {
  listing: Listing;
}

export const MarketRegion = ({ listing }: MarketRegionProps) => {
  TimeAgo.addLocale(en);
  // Create formatter (English).
  const timeAgo = new TimeAgo('en-US');

  const formatDuration = humanizer({ units: ['w', 'd', 'h'], round: true });

  const theme = useTheme();
  const { timeslicePeriod } = useCoretimeApi();

  const {
    state: { api: relayApi, apiState: relayApiState, symbol, decimals },
  } = useRelayApi();

  const [beginTimestamp, setBeginTimestamp] = useState(0);
  const [endTimestamp, setEndTimestamp] = useState(0);

  const { region, regionCoreOccupancy, regionConsumed } = listing;

  // FIXME: network-based block time
  const setTimestamps = useCallback(
    async (api: ApiPromise) => {
      const begin = await timesliceToTimestamp(
        api,
        region.getBegin(),
        timeslicePeriod
      );
      const end = await timesliceToTimestamp(
        api,
        region.getEnd(),
        timeslicePeriod
      );
      setBeginTimestamp(begin);
      setEndTimestamp(end);
    },
    [region, timeslicePeriod]
  );

  useEffect(() => {
    if (!relayApi || relayApiState !== ApiState.READY) {
      return;
    }

    setTimestamps(relayApi);
  }, [relayApi, relayApiState, setTimestamps]);

  const progress = [
    {
      label: 'Core Occupancy',
      value: regionCoreOccupancy ?? 0,
      color: 'primary',
    },
    {
      label: 'Consumed',
      value: regionConsumed ?? 0,
      color: 'success',
    },
  ];

  const prices = [
    {
      label: 'Price/timeslice:',
      value: getBalanceString(
        listing.timeslicePrice.toString(),
        decimals,
        symbol
      ),
    },
    {
      label: 'Total:',
      value: getBalanceString(
        listing.currentPrice.toString(),
        decimals,
        symbol
      ),
    },
  ];

  return (
    <Box className={styles.container}>
      <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Typography
          sx={{
            fontSize: '14px',
            color: theme.palette.common.black,
            fontWeight: 700,
          }}
        >
          {`Core Index: #${region.getCore()}`}
        </Typography>
        <Stack direction='row' alignItems='center' gap='0.5rem' fontSize={14}>
          <AccessTimeIcon />
          {formatDuration(endTimestamp - beginTimestamp)}
        </Stack>
      </Stack>
      <Box className={styles.timeInfo}>
        <Box className={styles.timeItem}>
          <Typography>Begin: </Typography>
          <Typography
            sx={{ color: theme.palette.common.black, fontWeight: 500 }}
          >
            {timeAgo.format(beginTimestamp)}
          </Typography>
        </Box>
        <Box className={styles.timeItem}>
          <Typography>End: </Typography>
          <Typography
            sx={{ color: theme.palette.common.black, fontWeight: 500 }}
          >
            {timeAgo.format(endTimestamp)}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          mt: '1.5rem',
        }}
      >
        {progress.map(({ label, value, color }, index) => (
          <Stack key={index} direction='column' gap='0.5rem'>
            <Stack direction='row' justifyContent='space-between'>
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: 13,
                  color: theme.palette.common.black,
                }}
              >
                {label}
              </Typography>
              <Typography
                variant='h2'
                sx={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: theme.palette.common.black,
                }}
              >
                {`${(value * 100).toFixed(2)}%`}
              </Typography>
            </Stack>
            <LinearProgress
              value={value * 100}
              valueBuffer={100}
              sx={{
                width: '20rem',
                height: '0.8rem',
              }}
              variant='buffer'
              color={color as 'success' | 'primary'}
            />
          </Stack>
        ))}
      </Box>
      <Paper
        sx={{
          mt: '2rem',
          padding: '1rem',
        }}
      >
        <Stack direction='row' justifyContent='space-between'>
          {prices.map(({ label, value }, index) => (
            <Box key={index} className={styles.priceItem}>
              <Typography sx={{ color: theme.palette.primary.main }}>
                {label}
              </Typography>
              <Typography
                sx={{ color: theme.palette.common.black, fontWeight: 700 }}
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};