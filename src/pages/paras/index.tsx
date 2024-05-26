import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Backdrop,
  Box,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  Switch,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { useParasInfo } from '@/hooks';

import {
  ActionButton,
  Order,
  ParachainTable,
  RegisterModal,
  ReserveModal,
} from '@/components';

import { leases } from '@/chaindata';
import { useNetwork } from '@/contexts/network';
import { useSettings } from '@/contexts/settings';
import { LeaseState, ParachainInfo } from '@/models';
const ParachainManagement = () => {
  const theme = useTheme();

  const router = useRouter();

  const { network } = useNetwork();
  const { watchList, setWatchList } = useSettings();
  const {
    loading,
    parachains,
    config: { nextParaId, reservationCost, dataDepositPerByte, maxCodeSize },
    fetchParaStates,
  } = useParasInfo();

  const [watchAll, watchAllParas] = useState(true);
  const [paras2Show, setParas2Show] = useState<ParachainInfo[]>([]);
  const [paraId2Reg, setParaId2Reg] = useState(0);
  const [search, setSearch] = useState('');

  const [reserveModalOpen, openReserveModal] = useState(false);
  const [registerModalOpen, openRegisterModal] = useState(false);

  const [orderBy, setOrderBy] = useState('id');
  const [direction, setDirection] = useState<Order>('asc');

  const handleSort = (_orderBy: string, _direction: Order) => {
    setOrderBy(_orderBy);
    setDirection(_direction);
  };

  // Register a parathread
  const onRegister = (paraId: number) => {
    setParaId2Reg(paraId);
    openRegisterModal(true);
  };

  // Renew coretime with the given para id
  const onRenew = (paraId: number) => {
    router.push({
      pathname: 'paras/renewal',
      query: { network, paraId },
    });
  };

  // Upgrade a parathread to parachain
  const onUpgrade = (_paraId: number) => {
    router.push({
      pathname: 'purchase',
      query: { network },
    });
  };

  // Buy coretime for the given parachain
  const onBuy = () => {
    router.push({
      pathname: 'purchase',
      query: { network },
    });
  };

  const onReserved = () => {
    openReserveModal(false);
    fetchParaStates();
  };

  const onRegistered = () => {
    openRegisterModal(false);
    fetchParaStates();
  };

  const onWatch = (id: number, watching: boolean) => {
    const newList = watchList.filter((value) => value !== id);
    if (watching) newList.push(id);
    setWatchList(newList);
  };

  useEffect(() => {
    const compId = (a: ParachainInfo, b: ParachainInfo) => {
      let result = a.id - b.id;
      if (direction === 'desc') result = -result;
      return result;
    };
    const compExpiry = (a: ParachainInfo, b: ParachainInfo) => {
      const chainData: LeaseState[] =
        (leases as Record<string, LeaseState[]>)[network.toString()] ?? [];

      const record1 = chainData.find((x) => x.paraId === a.id);
      const record2 = chainData.find((x) => x.paraId === b.id);
      const until1 =
        record1?.until ?? (direction === 'asc' ? Infinity : -Infinity);
      const until2 =
        record2?.until ?? (direction === 'asc' ? Infinity : -Infinity);
      let result = until1 - until2;
      if (direction === 'desc') result = -result;
      return result;
    };
    const parasWithWatchInfo = parachains.map((para) => ({
      ...para,
      watching: watchList.includes(para.id),
    }));
    const filtered = parasWithWatchInfo.filter(
      (para) =>
        para.id.toString().includes(search) &&
        (watchAll ? true : para.watching === true)
    );
    if (orderBy === 'id') {
      filtered.sort(compId);
    } else if (orderBy === 'expiry') {
      filtered.sort(compExpiry);
    }
    setParas2Show(filtered);
  }, [parachains, watchList, watchAll, search, orderBy, direction, network]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography
            variant='subtitle1'
            sx={{ color: theme.palette.common.black }}
          >
            Parachain Dashboard
          </Typography>
          <Typography
            variant='subtitle2'
            sx={{ color: theme.palette.text.primary }}
          >
            Watch parachains state, register and manage parachains
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: '1.5rem', height: '3.25rem' }}>
          <FormControlLabel
            control={
              <Switch
                color='success'
                checked={!watchAll}
                onChange={(e) => watchAllParas(!e.target.checked)}
              />
            }
            label='Watchlist Only'
            labelPlacement='start'
            sx={{
              color: theme.palette.common.black,
              padding: '0.25rem',
            }}
          />
          <TextField
            placeholder='Search by para id'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchOutlinedIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '.MuiInputBase-root': { borderRadius: '5rem', margin: 'auto 0' },
              '.MuiInputBase-input': {
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
              },
            }}
          />
          <ActionButton
            label='Reserve New Para'
            onClick={() => openReserveModal(true)}
          />
        </Box>
      </Box>
      {loading ? (
        <Backdrop open>
          <CircularProgress />
        </Backdrop>
      ) : (
        <Box sx={{ mt: '2rem', mb: '1rem', overflowY: 'auto' }}>
          <ParachainTable
            {...{
              parachains: paras2Show,
              handlers: { onBuy, onRenew, onRegister, onUpgrade, onWatch },
              orderBy,
              direction,
              handleSort,
            }}
          />
          <ReserveModal
            open={reserveModalOpen}
            onClose={onReserved}
            paraId={nextParaId}
            reservationCost={reservationCost}
          />
          <RegisterModal
            open={registerModalOpen}
            onClose={onRegistered}
            paraId={paraId2Reg}
            dataDepositPerByte={dataDepositPerByte}
            maxCodeSize={maxCodeSize}
          />
        </Box>
      )}
    </Box>
  );
};

export default ParachainManagement;
