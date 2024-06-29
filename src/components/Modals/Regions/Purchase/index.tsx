import { LoadingButton } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent } from '@mui/material';
import { BN } from '@polkadot/util';
import { useState } from 'react';

import { useSubmitExtrinsic } from '@/hooks/submitExtrinsic';

import { MarketRegion } from '@/components/Regions';

import { useAccounts } from '@/contexts/account';
import { useRegionXApi } from '@/contexts/apis/RegionXApi';
import { ApiState } from '@/contexts/apis/types';
import { useMarket } from '@/contexts/market';
import { useRegions } from '@/contexts/regions';
import { useToast } from '@/contexts/toast';
import { Listing, RELAY_ASSET_ID } from '@/models';

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  listing: Listing;
}

export const PurchaseModal = ({
  open,
  onClose,
  listing,
}: PurchaseModalProps) => {
  const {
    state: { activeAccount, activeSigner },
  } = useAccounts();
  const {
    state: { api: regionXApi, apiState: regionXApiState, symbol, decimals },
  } = useRegionXApi();
  const { fetchMarket } = useMarket();
  const { fetchRegions } = useRegions();

  const { toastError, toastSuccess, toastInfo, toastWarning } = useToast();
  const { submitExtrinsicWithFeeInfo } = useSubmitExtrinsic();

  const [working, setWorking] = useState(false);

  const purchaseRegion = async () => {
    if (!activeAccount) {
      return;
    }

    if (!regionXApi || regionXApiState !== ApiState.READY) {
      return;
    }
    if (!activeAccount || !activeSigner) {
      toastWarning('Please connect your wallet');
      return;
    }

    const regionDuration = new BN(
      listing.region.getEnd() - listing.region.getBegin()
    );
    const maxPrice = listing.timeslicePrice.mul(regionDuration);

    const txPurchase = regionXApi.tx.market.purchaseRegion(
      listing.region.getOnChainRegionId(),
      maxPrice.toString()
    );

    submitExtrinsicWithFeeInfo(
      symbol,
      decimals,
      txPurchase,
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
          toastSuccess('Successfully purchased the region');
          fetchMarket();
          fetchRegions();
          onClose();
        },
        fail: () => {
          toastError('Failed to purchase the region');
        },
        error: (e) => {
          console.log(e);
          toastError(
            `Failed to purchase the region. Error: ${
              e.errorMessage === 'Error'
                ? 'Please check your balance.'
                : e.errorMessage
            }`
          );
          setWorking(false);
        },
      },
      RELAY_ASSET_ID
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md'>
      <DialogContent>
        <MarketRegion listing={listing} />
      </DialogContent>
      <DialogActions
        sx={{
          '& > button': {
            flexBasis: '100%',
          },
          mt: '1rem',
          pb: '1rem',
        }}
      >
        <Button onClick={onClose} variant='outlined'>
          Cancel
        </Button>
        <LoadingButton
          onClick={() => purchaseRegion()}
          variant='contained'
          loading={working}
        >
          Purchase
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
