import { Balance, ContextData, Region } from 'coretime-utils';
import { Percentage } from '../types';

export class Listing {
  /// The reigon listed on sale.
  public region: Region;
  /// The percentage of the region that got consumed by now.
  public regionConsumed: Percentage;
  /// The percentage of the core the region ocucupies.
  public regionCoreOccupancy: Percentage;
  /// The seller of the region.
  public seller: string;
  /// The price per timeslice set by the seller.
  public timeslicePrice: Balance;
  /// The recepient of the sale.
  public saleRecepient: string | null;

  public static construct(
    context: ContextData,
    region: Region,
    seller: string,
    timeslicePrice: Balance,
    saleRecepient: string | null
  ): Listing {
    return new Listing(
      region,
      region.consumed(context),
      region.coreOccupancy(),
      seller,
      timeslicePrice,
      saleRecepient
    );
  }

  constructor(
    region: Region,
    regionConsumed: Percentage,
    regionCoreOccupancy: Percentage,
    seller: string,
    timeslicePrice: Balance,
    saleRecepient: string | null
  ) {
    this.region = region;
    this.regionConsumed = regionConsumed;
    this.regionCoreOccupancy = regionCoreOccupancy;
    this.seller = seller;
    this.timeslicePrice = timeslicePrice;
    this.saleRecepient = saleRecepient;
  }
}