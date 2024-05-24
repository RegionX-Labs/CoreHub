import { Box, Button, useTheme } from '@mui/material';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import moment from 'moment';
import { useState } from 'react';

import { getBalanceString } from '@/utils/functions';

import { SalePhaseCard } from '@/components/Elements';
import { PriceModal } from '@/components/Modals';

import DollarIcon from '@/assets/dollar.png';
import ListIcon from '@/assets/list.png';
import ShoppingIcon from '@/assets/shopping.png';
import { useCoretimeApi } from '@/contexts/apis';
import { SalePhase } from '@/models';

import { DetailCard } from './DetailCard';
import styles from './index.module.scss';

interface SaleInfoPanelProps {
  currentPhase: SalePhase;
  saleStartTimestamp: number;
  saleEndTimestamp: number;
  currentPrice: number;
  floorPrice: number;
}

export const SaleInfoPanel = ({
  currentPhase,
  saleStartTimestamp,
  saleEndTimestamp,
  currentPrice,
  floorPrice,
}: SaleInfoPanelProps) => {
  TimeAgo.addLocale(en);

  const theme = useTheme();

  const {
    state: { symbol, decimals },
  } = useCoretimeApi();

  const [priceModalOpen, openPriceModal] = useState(false);

  const nextPhase = (phase: SalePhase): SalePhase => {
    const phases = Object.values(SalePhase);
    const currentIndex = phases.indexOf(phase);

    // Calculate the index of the next phase
    const nextIndex = (currentIndex + 1) % phases.length;
    return phases[nextIndex];
  };

  const onAnalyze = () => {
    openPriceModal(true);
  };

  return (
    <>
      <Box className={styles.grid}>
        <DetailCard
          icon={ShoppingIcon}
          title='Sale details'
          items={{
            left: {
              label:
                saleStartTimestamp < Date.now() ? 'Started at' : 'Starts at:',
              value: moment(saleStartTimestamp).format('D MMM HH:mm'),
            },
            right: {
              label: saleEndTimestamp > Date.now() ? 'Ends at' : 'Ended at:',
              value: moment(saleEndTimestamp).format('D MMMM HH:mm'),
            },
          }}
        />
        <DetailCard icon={ListIcon} title='Phase details'>
          <SalePhaseCard label='Current phase' value={currentPhase} />
          <SalePhaseCard
            label='Upcoming phase'
            value={nextPhase(currentPhase)}
          />
        </DetailCard>
        <DetailCard
          icon={DollarIcon}
          title='Price details'
          items={{
            left: {
              label:
                (currentPhase as SalePhase) === SalePhase.Interlude
                  ? 'Start price'
                  : 'Current price',
              value: getBalanceString(
                currentPrice.toString(),
                decimals,
                symbol
              ),
            },
            right: {
              label: 'Floor price',
              value: getBalanceString(floorPrice.toString(), decimals, symbol),
            },
          }}
          button={
            <Button
              onClick={onAnalyze}
              size='small'
              variant='text'
              className={styles.buttonWrapper}
              sx={{
                background: '#e8eff7',
                color: theme.palette.text.secondary,
              }}
            >
              Analyze
            </Button>
          }
        />
      </Box>
      <PriceModal
        open={priceModalOpen}
        onClose={() => openPriceModal(false)}
        saleInfo={{ phase: currentPhase }}
      />
    </>
  );
};
