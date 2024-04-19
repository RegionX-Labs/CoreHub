import ArrowDownward from '@mui/icons-material/ArrowDownwardOutlined';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { useInkathon } from '@scio-labs/use-inkathon';
import { Region } from 'coretime-utils';
import { useEffect, useState } from 'react';

import theme from '@/utils/muiTheme';
import {
  transferNativeToken,
  transferRegionOnCoretimeChain,
} from '@/utils/native/transfer';

import {
  AmountInput,
  ChainSelector,
  RecipientSelector,
  RegionCard,
  RegionSelector,
} from '@/components';

import { useCoretimeApi, useRelayApi } from '@/contexts/apis';
import { useRegions } from '@/contexts/regions';
import { useToast } from '@/contexts/toast';
import { Asset, CORETIME_DECIMALS, RegionLocation, RegionMetadata } from '@/models';
import Balance from '@/components/Elements/Balance';
import AssetSelector from '@/components/Elements/Selectors/AssetSelector';
import { ApiState } from '@/contexts/apis/types';
import { fetchBalance } from '@/utils/functions';

const TransferPage = () => {
  const { activeAccount, activeSigner } = useInkathon();

  const { toastError, toastInfo, toastWarning, toastSuccess } = useToast();
  const {
    state: { api: coretimeApi, apiState: coretimeApiState },
  } = useCoretimeApi();
  const {
    state: { api: relayApi, apiState: relayApiState },
  } = useRelayApi();
  const { regions } = useRegions();

  const [filteredRegions, setFilteredRegions] = useState<Array<RegionMetadata>>(
    []
  );
  const [working, setWorking] = useState(false);

  const [newOwner, setNewOwner] = useState('');
  const [originChain, setOriginChain] = useState('');
  const [destinationChain, setDestinationChain] = useState('');
  const [statusLabel, _setStatusLabel] = useState('');

  const [selectedRegion, setSelectedRegion] = useState<RegionMetadata | null>(
    null
  );

  const [asset, setAsset] = useState<Asset>('token');
  const [transferAmount, setTransferAmount] = useState('');

  const [coretimeBalance, setCoretimeBalance] = useState(0);
  const [relayBalance, setRelayBalance] = useState(0);

  const defaultHandler = (onSuccess?: () => void) => {
    return {
      ready: () => toastInfo('Transaction was initiated.'),
      inBlock: () => toastInfo(`In Block`),
      finalized: () => setWorking(false),
      success: () => {
        onSuccess && onSuccess();
        toastSuccess('Successfully transferred the region.');
      },
      error: () => {
        toastError(`Failed to transfer the region.`);
        setWorking(false);
      },
    }
  };

  useEffect(() => {
    getBalances();
  }, [
    relayApi,
    relayApiState,
    coretimeApi,
    coretimeApiState,
    activeAccount,
  ]);

  const getBalances = async () => {
    if (
      !relayApi ||
      relayApiState !== ApiState.READY ||
      !coretimeApi ||
      coretimeApiState !== ApiState.READY ||
      !activeAccount
    )
      return;

    const rcBalance = await fetchBalance(relayApi, activeAccount.address);
    const ctBalance = await fetchBalance(coretimeApi, activeAccount.address);

    setRelayBalance(rcBalance);
    setCoretimeBalance(ctBalance);
  }

  useEffect(() => {
    setFilteredRegions(
      regions.filter((r) => r.location != RegionLocation.MARKET)
    );
  }, [regions]);

  const handleOriginChange = (newOrigin: string) => {
    setOriginChain(newOrigin);
    if (newOrigin === 'CoretimeChain') {
      setFilteredRegions(
        regions.filter((r) => r.location == RegionLocation.CORETIME_CHAIN)
      );
    } else {
      setFilteredRegions(
        regions.filter((r) => r.location == RegionLocation.REGIONX_CHAIN)
      );
    }
  };

  const handleTransfer = async () => {
    if (asset === 'region') {
      handleRegionTransfer();
    } else if (asset === 'token') {
      handleTokenTransfer();
    }
  };

  const handleTokenTransfer = async () => {
    if (!activeAccount || !activeSigner || !coretimeApi) return;
    if (!newOwner) {
      toastError('Recipient must be selected');
      return;
    }
    const amount = Number(transferAmount) * Math.pow(10, CORETIME_DECIMALS);
    if (originChain === destinationChain && originChain === 'CoretimeChain') {
      coretimeApi &&
        transferNativeToken(
          coretimeApi,
          activeSigner,
          activeAccount.address,
          newOwner,
          amount.toString(),
          defaultHandler(() => getBalances())
        );
    }
  };

  const handleRegionTransfer = async () => {
    if (!selectedRegion) {
      toastError('Select a region');
      return;
    }

    if (originChain === destinationChain) {
      originChain === 'CoretimeChain'
        ? await transferCoretimeRegion(selectedRegion.region)
        : toastWarning('Currently not supported');
    } else {
      toastWarning('Currently not supported');
    }
  };

  const transferCoretimeRegion = async (region: Region) => {
    if (!coretimeApi || !activeAccount || !activeSigner) return;
    if (!newOwner) {
      toastError('Please input the new owner.');
      return;
    }

    setWorking(true);
    transferRegionOnCoretimeChain(
      coretimeApi,
      region,
      activeSigner,
      activeAccount.address,
      newOwner ? newOwner : activeAccount.address,
      defaultHandler()
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography
            variant='subtitle2'
            sx={{ color: theme.palette.text.secondary }}
          >
            Cross-chain transfer regions
          </Typography>
          <Typography
            variant='subtitle1'
            sx={{ color: theme.palette.text.primary }}
          >
            Cross-Chain Transfer
          </Typography>
        </Box>
        <Balance coretimeBalance={coretimeBalance} relayBalance={relayBalance} />
      </Box>
      <Box width='60%' margin='2em auto'>
        <Stack margin='1em 0' direction='column' gap={1}>
          <AssetSelector asset={asset} setAsset={setAsset} />
        </Stack>
        <Stack margin='1em 0' direction='column' gap={1}>
          <Typography>Origin chain:</Typography>
          <ChainSelector chain={originChain} setChain={handleOriginChange} />
        </Stack>
        <Stack margin='1em 0' direction='column' gap={1}>
          <Typography>Destination chain:</Typography>
          <ChainSelector
            chain={destinationChain}
            setChain={setDestinationChain}
          />
        </Stack>
        {asset === "region" && originChain && destinationChain && (
          <Stack margin='1em 0' direction='column' gap={1}>
            <Typography>Region</Typography>
            <RegionSelector
              regions={filteredRegions}
              selectedRegion={selectedRegion}
              handleRegionChange={(indx) => setSelectedRegion(regions[indx])}
            />
          </Stack>
        )}
        {selectedRegion && (
          <Box
            sx={{
              transform: 'scale(0.8)',
              transformOrigin: 'center',
            }}
          >
            <RegionCard regionMetadata={selectedRegion} />
          </Box>
        )}
        <Stack margin='2em 0' direction='column' gap={1} alignItems='center'>
          <Typography>Transfer</Typography>
          <ArrowDownward />
        </Stack>
        <Stack direction='column' gap={1}>
          <Typography>Transfer to:</Typography>
          <RecipientSelector recipient={newOwner} setRecipient={setNewOwner} />
        </Stack>
        {asset === 'token' && originChain && destinationChain && (
          <Stack margin='2em 0' direction='column' gap={1}>
            <AmountInput
              amount={transferAmount}
              setAmount={setTransferAmount}
              currency='ROC'
              caption='Transfer amount'
            />
          </Stack>
        )}
        {statusLabel && (
          <Alert severity='info' sx={{ marginY: '2em' }}>
            {statusLabel}
          </Alert>
        )}
        <Box margin='2em 0'>
          <DialogActions>
            <Link href='/'>
              <Button variant='outlined'>Home</Button>
            </Link>
            <LoadingButton
              onClick={handleTransfer}
              variant='contained'
              loading={working}
            >
              Transfer
            </LoadingButton>
          </DialogActions>
        </Box>
      </Box>
    </Box>
  );
};

export default TransferPage;
