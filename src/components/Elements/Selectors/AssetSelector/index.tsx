import { ToggleButton, ToggleButtonGroup, useTheme } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import styles from './index.module.scss';
import { AssetType } from '@/models';

interface AssetSelectorProps {
  asset: AssetType;
  setAsset: (_: AssetType) => void;
  symbol: string;
}

export default function AssetSelector({
  asset,
  setAsset,
  symbol,
}: AssetSelectorProps) {
  const theme = useTheme();
  return (
    <FormControl>
      <ToggleButtonGroup
        value={asset}
        exclusive // This ensures only one can be selected at a time
        onChange={(e: any) => {
          console.log(e.target.value);
          setAsset(parseInt(e.target.value) as AssetType)
        }}
        className={styles.options}
      >
        <ToggleButton className={styles.option}
          sx={{ color: theme.palette.text.primary }}
          value={AssetType.TOKEN}>
          {symbol}
        </ToggleButton>
        <ToggleButton className={styles.option}
          sx={{ color: theme.palette.text.primary }}
          value={AssetType.REGION}>
          Region
        </ToggleButton>
      </ToggleButtonGroup>
    </FormControl>
  );
}
