import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Paper,
  Switch,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';

import {
  ActionButton,
  Balance,
  ContributionModal,
  OrderCard,
  OrderCreationModal,
} from '@/components';

import { useOrders } from '@/contexts/orders';
import { ContextStatus, Order } from '@/models';

const OrderDashboard = () => {
  const theme = useTheme();
  const { orders, status } = useOrders();

  const [orderCreationModalOpen, openOrderCreationModal] = useState(false);
  const [expiredOnly, watchExpired] = useState(false);

  const [ordersToShow, setOrdersToShow] = useState<Order[]>([]);
  const [orderSelected, selectOrder] = useState<Order | undefined>();
  const [contributionModal, openContributionModal] = useState(false);

  useEffect(() => {
    // TODO: expiry
    setOrdersToShow(orders);
  }, [orders]);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '1rem' }}>
        <Balance rxNativeBalance rxRcCurrencyBalance />
      </Box>
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
            Orders Dashboard
          </Typography>
          <Typography
            variant='subtitle2'
            sx={{ color: theme.palette.text.primary }}
          >
            Explorer the orders
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: '1.5rem', height: '3.25rem' }}>
          <FormControlLabel
            control={
              <Switch
                color='success'
                checked={expiredOnly}
                onChange={(e) => watchExpired(e.target.checked)}
              />
            }
            label='Expired Only'
            labelPlacement='start'
            sx={{
              color: theme.palette.common.black,
              padding: '0.25rem',
            }}
          />

          <ActionButton
            label='Create New Order'
            onClick={() => openOrderCreationModal(true)}
          />
        </Box>
      </Box>
      {status === ContextStatus.ERROR ? (
        <Box mt='1rem'>
          <Typography>An error occured while fetching the orders.</Typography>
        </Box>
      ) : status !== ContextStatus.LOADED ? (
        <Backdrop open>
          <CircularProgress />
        </Backdrop>
      ) : (
        <Box
          mt='2rem'
          display='flex'
          flexWrap='wrap'
          justifyContent='space-around'
        >
          {ordersToShow.map((order: Order, index: number) => (
            <Paper key={index} sx={{ padding: '1.5rem' }}>
              <OrderCard order={order} />
              <Button
                fullWidth
                variant='contained'
                sx={{
                  borderRadius: '1rem',
                  mt: '1.5rem',
                }}
                onClick={() => {
                  selectOrder(order);
                  openContributionModal(true);
                }}
              >
                Contribute
              </Button>
            </Paper>
          ))}
        </Box>
      )}

      <OrderCreationModal
        open={orderCreationModalOpen}
        onClose={() => openOrderCreationModal(false)}
      />
      {orderSelected !== undefined && (
        <ContributionModal
          open={contributionModal}
          onClose={() => openContributionModal(false)}
          order={orderSelected}
        />
      )}
    </>
  );
};

export default OrderDashboard;
