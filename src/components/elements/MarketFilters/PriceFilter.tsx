import { Box, Slider, Typography } from '@mui/material';
import { useState } from 'react';

import { formatBalance } from '@/utils/functions';

import { FilterProps } from '.';

const PriceFilter = ({ listings, filters, updateFilters }: FilterProps) => {
  const maxValue = (): number => {
    if (listings.length < 1) return 0;
    const sortedListings = new Array(...listings);
    sortedListings.sort((a, b) => b.currentPrice - a.currentPrice);
    return Number(formatBalance(sortedListings[0].currentPrice));
  };

  const [priceLimit, setPriceLimit] = useState(maxValue());

  const handleChange = (_e: Event, newValue: number | number[]) => {
    setPriceLimit(newValue as number);
    updateFilters({
      ...filters,
      priceFilter: (listing) =>
        Number(formatBalance(listing.currentPrice)) <= (newValue as number),
    });
  };

  return (
    <Box width={240}>
      <Typography marginBottom={'.5em'}>Price Limit</Typography>
      <Box marginTop={'2em'}>
        <Slider
          defaultValue={70}
          max={maxValue()}
          color='info'
          value={priceLimit}
          onChange={handleChange}
          aria-label='Always visible'
          valueLabelDisplay='on'
          valueLabelFormat={(value) => `${value} ROC`}
        />
      </Box>
    </Box>
  );
};

export default PriceFilter;
