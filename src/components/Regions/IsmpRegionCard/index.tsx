import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import {
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { useEffect, useState } from 'react';

import { useSubmitExtrinsic } from '@/hooks/submitExtrinsic';
import { timesliceToTimestamp } from '@/utils/functions';
import { makeResponse, makeTimeout, queryRequest } from '@/utils/ismp';

import { useAccounts } from '@/contexts/account';
import { useCoretimeApi, useRelayApi } from '@/contexts/apis';
import { useRegionXApi } from '@/contexts/apis/RegionXApi';
import { ApiState } from '@/contexts/apis/types';
import { useRegions } from '@/contexts/regions';
import { useToast } from '@/contexts/toast';
import { ISMPRecordStatus, RELAY_ASSET_ID, RegionMetadata } from '@/models';

import styles from './index.module.scss';

interface IsmpRegionProps {
  regionMetadata: RegionMetadata;
}

export const IsmpRegionCard = ({ regionMetadata }: IsmpRegionProps) => {
  TimeAgo.addLocale(en);
  // Create formatter (English).
  const timeAgo = new TimeAgo('en-US');

  const {
    state: { api: relayApi, apiState: relayApiState },
  } = useRelayApi();
  const {
    state: { api: coretimeApi, apiState: coretimeApiState },
    timeslicePeriod,
  } = useCoretimeApi();
  const {
    state: {
      api: regionxApi,
      apiState: regionxApiState,
      symbol: regionxSymbol,
      decimals: regionxDecimals,
    },
  } = useRegionXApi();
  const {
    state: { activeAccount, activeSigner },
  } = useAccounts();

  const { fetchRegions } = useRegions();

  const theme = useTheme();

  const [beginTimestamp, setBeginTimestamp] = useState(0);

  const { region, coreOccupancy, status } = regionMetadata;
  const { toastWarning, toastSuccess, toastInfo, toastError } = useToast();
  const { submitExtrinsicWithFeeInfo } = useSubmitExtrinsic();

  useEffect(() => {
    if (!relayApi || relayApiState !== ApiState.READY) {
      return;
    }
    const fetchTimestamp = async () => {
      const timestamp = await timesliceToTimestamp(
        relayApi,
        region.getBegin(),
        timeslicePeriod
      );
      setBeginTimestamp(timestamp);
    };
    fetchTimestamp();
  }, [relayApi, relayApiState, timeslicePeriod, region]);

  useEffect(() => {
    if (
      !coretimeApi ||
      coretimeApiState !== ApiState.READY ||
      !regionxApi ||
      regionxApiState !== ApiState.READY ||
      !activeAccount
    ) {
      return;
    }

    const onError = () =>
      toastWarning(
        `Failed to fulfill ISMP request. Wait 5 minutes to re-request`
      );

    const respond = async (commitment: string) => {
      try {
        const request: any = await queryRequest(regionxApi, commitment);
        const currentTimestamp = (
          await regionxApi.query.timestamp.now()
        ).toJSON() as number;

        if (
          request.get &&
          currentTimestamp / 1000 > request.get.timeout_timestamp
        ) {
          await makeTimeout(regionxApi, request, {
            ready: () => toastInfo('Request timed out'),
            inBlock: () => {
              /* */
            },
            finalized: () => {
              /* */
            },
            success: () => {
              fetchRegions();
            },
            fail: () => {
              /** */
            },
            error: () => {
              /* */
            },
          });
          fetchRegions();
        } else {
          await makeResponse(
            regionxApi,
            coretimeApi,
            request,
            activeAccount.address,
            {
              ready: () => toastInfo('Fetching region record.'),
              inBlock: () => toastInfo('In Block'),
              finalized: () => {
                /* */
              },
              success: () => {
                toastSuccess('Region record fetched.');
                fetchRegions();
              },
              fail: () => {
                toastError(`Failed to fetch region record.`);
              },
              error: () => {
                /** */
              },
            }
          );
        }
      } catch {
        onError();
      }
    };

    if (status === ISMPRecordStatus.PENDING) {
      regionMetadata.requestCommitment
        ? respond(regionMetadata.requestCommitment)
        : onError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coretimeApi, regionxApi, coretimeApiState, regionxApiState]);

  const requestRegionRecord = async () => {
    if (
      !regionxApi ||
      regionxApiState !== ApiState.READY ||
      !activeAccount ||
      !activeSigner
    ) {
      return;
    }

    const request = regionxApi.tx.regions.requestRegionRecord(
      region.getRegionId()
    );
    submitExtrinsicWithFeeInfo(
      regionxSymbol,
      regionxDecimals,
      request,
      activeAccount.address,
      activeSigner,
      {
        ready: () => toastInfo('Transaction was initiated'),
        inBlock: () => toastInfo('In Block'),
        finalized: () => {
          /** */
        },
        success: () => {
          toastSuccess('Transaction successful');
          fetchRegions();
        },
        fail: () => {
          toastError(`Failed to request region record`);
        },
        error: (e) => {
          toastError(`Failed to request the region record. ${e}`);
        },
      },
      RELAY_ASSET_ID
    );
  };

  return (
    <Paper className={styles.container}>
      <Box
        className={styles.infoContainer}
        sx={{
          opacity: status !== ISMPRecordStatus.AVAILABLE ? 0.3 : 1,
        }}
      >
        <Box className={styles.regionInfo}>
          <Box>
            <Typography className={styles.regionName}>
              {regionMetadata.name}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: theme.palette.common.black }}>
              {`Core Index: #${region.getCore()}`}
            </Typography>
          </Box>
        </Box>
        <Box className={styles.timeInfo}>
          <Stack direction='column'>
            <Typography>Begin:</Typography>
            <Typography sx={{ color: theme.palette.common.black }}>
              {timeAgo.format(beginTimestamp)}
            </Typography>
          </Stack>
          <Stack direction='column' gap='0.2rem'>
            <Typography>Core Occupancy</Typography>
            <Box sx={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <LinearProgress
                value={coreOccupancy * 100}
                valueBuffer={100}
                sx={{
                  width: '15rem',
                  height: '0.8em',
                }}
                variant='buffer'
                color='success'
              />
              <Typography
                variant='h2'
                sx={{
                  color: theme.palette.text.primary,
                  width: '3rem',
                  fontWeight: 400,
                }}
              >
                {`${(coreOccupancy * 100).toFixed(2)}%`}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
      <Box className={styles.statusContainer}>
        {status === ISMPRecordStatus.PENDING ? (
          <>
            <CircularProgress size='1.5rem' />
            <Typography sx={{ color: theme.palette.primary.main }}>
              Fetching region record...
            </Typography>
          </>
        ) : status === ISMPRecordStatus.UNAVAILABLE ? (
          <>
            <Stack direction='row' gap='0.5rem'>
              <WarningAmberOutlinedIcon color='error' />
              <Typography sx={{ color: theme.palette.error.main }}>
                Failed to fetch region record
              </Typography>
            </Stack>
            <Button variant='outlined' onClick={requestRegionRecord}>
              Request again
            </Button>
          </>
        ) : (
          <></>
        )}
      </Box>
    </Paper>
  );
};
