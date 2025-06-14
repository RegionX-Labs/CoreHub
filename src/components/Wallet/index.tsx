import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  List,
  ListItemButton,
  Typography,
} from '@mui/material';
import Image from 'next/image';

import styles from './index.module.scss';
import { SubstrateWallet, enableWallet, isWalletInstalled, polkadotjs, subwallet, talisman } from './wallets';
import theme from '@/utils/muiTheme';
import { OpenInNew } from '@mui/icons-material';
import { useAccounts } from '@/contexts/account';
import { APP_NAME } from '@/consts';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;

}

export const allSubstrateWallets: SubstrateWallet[] = [
  subwallet,
  talisman,
  polkadotjs,
];

export const WalletModal = (props: WalletModalProps) => {

  const { connectWallet } = useAccounts();
  const onConnect = async (wallet: SubstrateWallet) => {
    const injectedExstension = await enableWallet(wallet, APP_NAME);
    if (!injectedExstension) {
      console.log("Failed to enable wallet");
      return;
    }
    connectWallet(injectedExstension);
    props.onClose();
  };

  return (
    <Dialog {...props} fullWidth maxWidth='sm'>
      <DialogContent className={styles.container}>
        <Typography variant='subtitle1' sx={{ color: theme.palette.common.black }}>
          Choose Wallet
        </Typography>
        <List>
          {allSubstrateWallets.map((wallet, index) => (
            <ListItemButton
              key={index}
              onClick={() => onConnect(wallet)}
              disabled={!isWalletInstalled(wallet)}
            >
              <Image
                className={styles.logo}
                alt='logo'
                src={wallet.logoUrls[0]}
                width={32}
                height={32}
              />
              {wallet.name}
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
