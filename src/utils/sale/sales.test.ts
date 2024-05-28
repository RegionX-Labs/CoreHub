import {
  CORETIME_TOKEN_UNIT,
  NetworkType,
  SaleInfo,
  SalePhase,
} from '@/models';

import {
  getCorePriceAt,
  getCurrentPhase,
  getSaleEndInRelayBlocks,
  getSaleStartInRelayBlocks,
} from '.';

describe('Purchase page', () => {
  const mockSaleInfo: SaleInfo = {
    coresOffered: 50,
    coresSold: 0,
    firstCore: 45,
    idealCoresSold: 5,
    leadinLength: 21600, // Block number
    price: 50 * CORETIME_TOKEN_UNIT,
    regionBegin: 124170, // Timeslice
    regionEnd: 125430, // Timeslice
    saleStart: 1001148, // Block number
    selloutPrice: null,
  };

  describe('getCurrentPhase', () => {
    it('Successfully recognizes interlude phase', () => {
      let blockNumber = mockSaleInfo.saleStart - 50;
      expect(getCurrentPhase(mockSaleInfo, blockNumber)).toBe(
        SalePhase.Interlude
      );

      blockNumber = mockSaleInfo.saleStart - 1;
      expect(getCurrentPhase(mockSaleInfo, blockNumber)).toBe(
        SalePhase.Interlude
      );

      blockNumber = mockSaleInfo.saleStart;
      expect(getCurrentPhase(mockSaleInfo, blockNumber)).not.toBe(
        SalePhase.Interlude
      );
    });

    it('Successfully recognizes leadin phase', () => {
      let blockNumber = mockSaleInfo.saleStart;
      expect(getCurrentPhase(mockSaleInfo, blockNumber)).toBe(SalePhase.Leadin);

      blockNumber = mockSaleInfo.saleStart + mockSaleInfo.leadinLength - 1;
      expect(getCurrentPhase(mockSaleInfo, blockNumber)).toBe(SalePhase.Leadin);

      blockNumber = mockSaleInfo.saleStart + mockSaleInfo.leadinLength;
      expect(getCurrentPhase(mockSaleInfo, blockNumber)).not.toBe(
        SalePhase.Leadin
      );
    });

    it('Successfully recognizes fixed price phase', () => {
      let blockNumber = mockSaleInfo.saleStart + mockSaleInfo.leadinLength;
      expect(getCurrentPhase(mockSaleInfo, blockNumber)).toBe(
        SalePhase.Regular
      );

      blockNumber = mockSaleInfo.saleStart + mockSaleInfo.leadinLength + 50;
      expect(getCurrentPhase(mockSaleInfo, blockNumber)).toBe(
        SalePhase.Regular
      );
    });
  });

  describe('getSaleStartInBlocks', () => {
    it('works', () => {
      expect(getSaleStartInRelayBlocks(mockSaleInfo, 80)).toBe(9832800);
    });
  });

  describe('getSaleEndInBlocks', () => {
    it('works', () => {
      expect(getSaleEndInRelayBlocks(mockSaleInfo, 80)).toBe(9933600);
    });
  });

  describe('getCorePriceAt', () => {
    it('works for rococo', () => {
      const blockNumber = mockSaleInfo.saleStart;

      // leading factor is equal to 2 at the start of the sale.
      expect(
        getCorePriceAt(blockNumber, mockSaleInfo, NetworkType.ROCOCO)
      ).toBe(mockSaleInfo.price * 2);
    });

    it('works for kusama', () => {
      const blockNumber = mockSaleInfo.saleStart;

      // leading factor is equal to 2 at the start of the sale.
      expect(
        getCorePriceAt(blockNumber, mockSaleInfo, NetworkType.KUSAMA)
      ).toBe(mockSaleInfo.price * 5);
    });
  });
});
