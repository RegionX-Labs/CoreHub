import HistoryIcon from '@mui/icons-material/History';
import { Box, IconButton, Stack, useTheme } from '@mui/material';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { Button, Select } from '@region-x/components';
import React, { useState } from 'react';

import { Address, NetworkSelector, TxHistoryModal } from '@/components';

import { useAccounts } from '@/contexts/account';

import styles from './index.module.scss';
import { WalletModal } from '@/components/Wallet';

export const Header = () => {
  const theme = useTheme();
  const {
    state: { accounts, activeAccount },
    setActiveAccount,
    disconnectWallet,
    connectWallet,
  } = useAccounts();

  const [txHistoryModalOpen, openTxHistoryModal] = useState(false);

  const [walletModalOpen, openWalletModal] = useState(false);

  const onDisconnect = () => {
    disconnectWallet();
  };

  const onAccountChange = (acc: InjectedAccountWithMeta | null) => {
    if (!acc) {
      onDisconnect();
      return;
    }

    setActiveAccount(acc);
  };

  const availableAccounts = () => {
    const filteredAccounts: Array<InjectedAccountWithMeta | null> = accounts.filter(
      (acc) => acc.type === 'sr25519'
    );
    // This will represent the disconnect option.
    filteredAccounts.push(null);

    return filteredAccounts.map((acc) => {
      if (!acc) return { value: null, label: 'Disconnect' };
      else return { value: acc, label: `${acc.meta.name}(${acc.meta.source})` };
    });
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          background: theme.palette.background.paper,
          borderLeft: `1px solid ${theme.palette.divider}`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box className={styles.menu}>
          <div>
            <NetworkSelector />
          </div>
          {activeAccount ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                width: '100%',
                justifyContent: 'right',
              }}
            >
              <Stack direction='row' gap='0.25rem' alignItems='center'>
                <Address value={activeAccount.address} isCopy isShort />
                <IconButton onClick={() => openTxHistoryModal(true)}>
                  <HistoryIcon />
                </IconButton>
              </Stack>
              <Box width='300px'>
                <Select
                  options={availableAccounts()}
                  searchable={true}
                  onChange={(acc: InjectedAccountWithMeta | null) => onAccountChange(acc)}
                  selectedValue={activeAccount as any}
                />
              </Box>
            </Box>
          ) : (
            <Button data-cy='connect-wallet' onClick={() => openWalletModal(true)}>
              Connect Wallet
            </Button>
          )}
        </Box>
      </Box>
      {activeAccount?.address ? (
        <TxHistoryModal
          open={txHistoryModalOpen}
          onClose={() => openTxHistoryModal(false)}
          account={activeAccount.address}
        />
      ) : (
        <></>
      )}
      {walletModalOpen &&
        <WalletModal
          open={walletModalOpen}
          onClose={() => openWalletModal(false)}
        />
      }
    </>
  );
};
