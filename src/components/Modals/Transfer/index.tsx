import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { contractTx, useContract, useInkathon } from '@scio-labs/use-inkathon';
import { useEffect, useState } from 'react';

import { encodeRegionId } from '@/utils/functions';

import { RegionCard } from '@/components/elements';

import { useCoretimeApi } from '@/contexts/apis';
import { CONTRACT_XC_REGIONS } from '@/contexts/apis/consts';
import { useRegions } from '@/contexts/regions';
import { useToast } from '@/contexts/toast';
import XcRegionsMetadata from "@/contracts/xc_regions.json";
import { OnChainRegionId, RegionMetadata, RegionOrigin } from '@/models';

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  region: RegionMetadata;
}

export const TransferModal = ({
  open,
  onClose,
  region,
}: TransferModalProps) => {
  const { activeAccount, activeSigner, api: contractsApi } = useInkathon();
  const { contract } = useContract(XcRegionsMetadata, CONTRACT_XC_REGIONS);

  const { fetchRegions } = useRegions();
  const { toastError, toastInfo, toastSuccess } = useToast();
  const {
    state: { api: coretimeApi },
  } = useCoretimeApi();

  const [newOwner, setNewOwner] = useState('');
  const [working, setWorking] = useState(false);

  const onTransfer = () => {
    if (region.origin === RegionOrigin.CORETIME_CHAIN) {
      transferCoretimeRegion(region.rawId);
    } else if (region.origin === RegionOrigin.CONTRACTS_CHAIN) {
      transferXcRegion(region.rawId);
    }
  };

  const transferCoretimeRegion = async (regionId: OnChainRegionId) => {
    if (!coretimeApi || !activeAccount || !activeSigner) return;
    if (!newOwner) {
      toastError('Please input the new owner.');
      return;
    }
    const txTransfer = coretimeApi.tx.broker.transfer(regionId, newOwner);

    try {
      setWorking(true);
      await txTransfer.signAndSend(
        activeAccount.address,
        { signer: activeSigner },
        ({ status, events }) => {
          if (status.isReady) toastInfo('Transaction was initiated.');
          else if (status.isInBlock) toastInfo(`In Block`);
          else if (status.isFinalized) {
            setWorking(false);
            events.forEach(({ event: { method } }) => {
              if (method === 'ExtrinsicSuccess') {
                toastSuccess('Successfully transferred the region.');
                onClose();
                fetchRegions();
              } else if (method === 'ExtrinsicFailed') {
                toastError(`Failed to transfer the region.`);
              }
            });
          }
        }
      );
    } catch (e) {
      toastError(`Failed to transfer the region. ${e}`);
      setWorking(false);
    }
  };

  const transferXcRegion = async (regionId: OnChainRegionId) => {
    if (!contractsApi || !activeAccount || !contract) {
      return;
    }

    try {
      setWorking(true);
      const rawRegionId = encodeRegionId(contractsApi, regionId);
      const id = contractsApi.createType("Id", { U128: rawRegionId });

      await contractTx(
        contractsApi,
        activeAccount.address,
        contract,
        'PSP34::transfer',
        {},
        [newOwner, id, []]
      );

      toastSuccess(`Successfully transferred the xcRegion.`);
      onClose();
      fetchRegions();
    } catch (e: any) {
      toastError(
        `Failed to transfer the region. Error: ${e.errorMessage === 'Error'
          ? 'Please check your balance.'
          : e
        }`
      );
      setWorking(false);
    }
  }

  useEffect(() => {
    setNewOwner('');
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md'>
      <DialogContent>
        <Stack direction='column' gap={3}>
          <RegionCard region={region} bordered={false} />
          <Stack direction='column' gap={1} alignItems='center'>
            <Typography>Transfer to</Typography>
            <ArrowDownwardOutlinedIcon />
          </Stack>
          <Stack direction='column' gap={2}>
            <Typography>New owner:</Typography>
            <TextField
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <LoadingButton
          onClick={onTransfer}
          variant='contained'
          loading={working}
        >
          Transfer
        </LoadingButton>
        <Button onClick={onClose} variant='outlined'>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
