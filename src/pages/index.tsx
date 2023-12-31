import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';

import {
  InterlaceModal,
  PartitionModal,
  RegionCard,
  TaskAssignModal,
  TransferModal,
} from '@/components';

import { useRegions } from '@/contexts/regions';
import {
  AssignmentIcon,
  InterlaceIcon,
  PartitionIcon,
  TransferIcon,
} from '@/icons';
import { RegionOrigin } from '@/models';

const Home = () => {
  const theme = useTheme();
  const { regions, loading, updateRegionName } = useRegions();

  const [currentRegionIndex, setCurrentRegionIndex] = useState<number>();
  const [partitionModalOpen, openPartitionModal] = useState(false);
  const [interlaceModalOpen, openInterlaceModal] = useState(false);
  const [assignModalOpen, openAssignModal] = useState(false);
  const [transferModalOpen, openTransferModal] = useState(false);

  const selectedRegion =
    currentRegionIndex === undefined ? undefined : regions[currentRegionIndex];
  const regionSelected = selectedRegion !== undefined;

  const management = [
    {
      label: 'partition',
      icon: PartitionIcon,
      onClick: () => openPartitionModal(true),
    },
    {
      label: 'interlace',
      icon: InterlaceIcon,
      onClick: () => openInterlaceModal(true),
    },
    {
      label: 'transfer',
      icon: TransferIcon,
      onClick: () => openTransferModal(true),
    },
    {
      label: 'assign',
      icon: AssignmentIcon,
      onClick: () => openAssignModal(true),
    },
  ];

  const isDisabled = (action: string): boolean => {
    if (!selectedRegion) return false;
    // XcRegions can only be transferred. 
    return action !== "transfer" && selectedRegion.origin !== RegionOrigin.CORETIME_CHAIN;
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: '1rem' }}>
      <Box sx={{ maxWidth: '45rem', flexGrow: 1, overflow: 'auto' }}>
        <Box>
          <Typography
            variant='subtitle2'
            sx={{ color: theme.palette.text.secondary }}
          >
            Manage your cores
          </Typography>
          <Typography
            variant='subtitle1'
            sx={{ color: theme.palette.text.primary }}
          >
            Regions Dashboard
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            mt: '1rem',
          }}
        >
          <Backdrop open={loading}>
            <CircularProgress />
          </Backdrop>
          {regions.map((region, index) => (
            <Box key={index} onClick={() => setCurrentRegionIndex(index)}>
              <RegionCard
                region={region}
                active={index === currentRegionIndex}
                editable
                updateName={(name) => updateRegionName(index, name)}
              />
            </Box>
          ))}
        </Box>
      </Box>
      <Box
        sx={{
          position: 'fixed',
          right: '10rem',
          color: theme.palette.text.secondary,
          background: theme.palette.background.default,
          minWidth: 280,
          height: 500,
          margin: 'auto',
          padding: '2rem 3rem',
        }}
      >
        <Typography variant='h1'>Manage</Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            marginTop: '3rem',
            alignItems: 'flex-start',
          }}
        >
          {management.map(({ label, icon: Icon, onClick }, index) => (
            <Button
              key={index}
              sx={{
                color: theme.palette.text.secondary,
                textTransform: 'capitalize',
              }}
              startIcon={<Icon color={theme.palette.text.secondary} />}
              disabled={isDisabled(label)}
              onClick={onClick}
            >
              {label}
            </Button>
          ))}
        </Box>
      </Box>
      {regionSelected && (
        <>
          <PartitionModal
            open={partitionModalOpen}
            onClose={() => openPartitionModal(false)}
            region={selectedRegion}
          />
          <InterlaceModal
            open={interlaceModalOpen}
            onClose={() => openInterlaceModal(false)}
            region={selectedRegion}
          />
          <TaskAssignModal
            open={assignModalOpen}
            onClose={() => openAssignModal(false)}
            region={selectedRegion}
          />
          <TransferModal
            open={transferModalOpen}
            onClose={() => openTransferModal(false)}
            region={selectedRegion}
          />
        </>
      )}
    </Box>
  );
};

export default Home;
