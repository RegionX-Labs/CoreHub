import { useEffect, useState } from 'react';

import { fetchSalesHistoryData } from '@/apis';
import { ApiResponse, NetworkType, SalesHistoryItem } from '@/models';

export const useSalesHistory = (network: NetworkType) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SalesHistoryItem[]>([]);
  const [isError, setError] = useState(false);

  useEffect(() => {
    const asyncFetchData = async () => {
      setData([]);
      setError(false);
      setLoading(false);

      try {
        setLoading(true);
        let finished = false;
        let after: string | null = null;

        const result = [];
        while (!finished) {
          const res: ApiResponse = await fetchSalesHistoryData(network, after);

          const { status, data } = res;
          if (status !== 200) break;

          if (data.sales.nodes !== null) result.push(...data.sales.nodes);

          finished = !data.sales.pageInfo.hasNextPage;
          after = data.sales.pageInfo.endCursor;
        }
        if (!finished) {
          setError(true);
        } else {
          setData(
            result.map(
              ({ id, regionBegin, regionEnd }) =>
                ({
                  id,
                  regionBegin,
                  regionEnd,
                } as SalesHistoryItem)
            )
          );
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    asyncFetchData();
  }, [network]);

  return {
    loading,
    data,
    isError,
  };
};
