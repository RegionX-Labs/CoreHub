import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { useState } from 'react';

import { getBalanceString } from '@/utils/functions';

import { Address, Link } from '@/components/Elements';

import { SUSBCAN_CORETIME_URL } from '@/consts';
import { useCoretimeApi } from '@/contexts/apis';
import { useNetwork } from '@/contexts/network';
import { OrderItem } from '@/models';

import { StyledTableCell, StyledTableRow } from '../common';

interface OrderProcessorTableProps {
  data: OrderItem[];
}

export const OrderProcessorTable = ({ data }: OrderProcessorTableProps) => {
  TimeAgo.addLocale(en);
  // Create formatter (English).
  const timeAgo = new TimeAgo('en-US');

  const { network } = useNetwork();
  const {
    state: { decimals },
  } = useCoretimeApi();

  // table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Stack direction='column' gap='1em'>
      <TableContainer component={Paper} sx={{ height: '32rem' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell>Order Id</StyledTableCell>
              <StyledTableCell>Extrinsic Id</StyledTableCell>
              <StyledTableCell>Who</StyledTableCell>
              <StyledTableCell>Reward</StyledTableCell>
              <StyledTableCell>Timestamp</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : data
            ).map(
              ({ orderId, extrinsicId, account, reward, timestamp }, index) => (
                <StyledTableRow key={index}>
                  <StyledTableCell align='center'>{orderId}</StyledTableCell>
                  <StyledTableCell align='center'>
                    <Link
                      href={`${SUSBCAN_CORETIME_URL[network]}/extrinsic/${extrinsicId}`}
                      target='_blank'
                    >
                      {extrinsicId}
                    </Link>
                  </StyledTableCell>
                  <StyledTableCell align='center'>
                    <Link
                      href={`${SUSBCAN_CORETIME_URL[network]}/account/${account}`}
                      target='_blank'
                    >
                      <Address
                        value={account}
                        isCopy={true}
                        isShort={true}
                        size={24}
                        center={true}
                      />
                    </Link>
                  </StyledTableCell>
                  <StyledTableCell align='center'>
                    {getBalanceString(reward.toString(), decimals, '')} DOT
                  </StyledTableCell>
                  <StyledTableCell align='center'>
                    {timeAgo.format(
                      new Date(timestamp).getTime(),
                      'round-minute'
                    )}
                  </StyledTableCell>
                </StyledTableRow>
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack alignItems='center'>
        <Table>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[10, 25, { label: 'All', value: -1 }]}
                colSpan={3}
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                slotProps={{
                  select: {
                    inputProps: {
                      'aria-label': 'rows per page',
                    },
                    native: true,
                  },
                }}
                sx={{
                  '.MuiTablePagination-spacer': {
                    flex: '0 0 0',
                  },
                  '.MuiTablePagination-toolbar': {
                    justifyContent: 'center',
                  },
                }}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </Stack>
    </Stack>
  );
};
