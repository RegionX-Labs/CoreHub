import { Box, Card, Stack, Typography, useTheme } from '@mui/material';

import { OrderProcessorTable } from '@/components';

import { OrderItem } from '@/models';

const OrderProcessor = () => {
	const theme = useTheme();

	// TODO: remove mockup data
	const mockupData: OrderItem[] = [
		{
			orderId: 1,
			extrinsicId: '2436843-3',
			account: '5EULYMVuML584aiyacnwjw1sb9iXu9NkdMVLz3MCgCrHmSFn',
			reward: 12300000,
			timestamp: new Date(),
		},
	];

	return (
		<Stack direction='column' gap='1.5rem'>
			<Card sx={{ padding: '1.5rem' }} data-cy='purchase-history-table'>
				<Stack direction='column' gap='1rem'>
					<Box>
						<Typography
							variant='subtitle1'
							sx={{ color: theme.palette.common.black }}
						>
							Order Processor UI
						</Typography>
						<Typography
							variant='subtitle2'
							sx={{ color: theme.palette.text.primary }}
						>
							See all the orders that were fulfilled
						</Typography>
					</Box>
					<OrderProcessorTable data={mockupData} />
				</Stack>
			</Card>
		</Stack>
	);
};

export default OrderProcessor;
