export const COREMASK_BIT_LEN = 80;

export const SECOND = 1 * 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const RELAY_CHAIN_BLOCK_TIME = 6 * SECOND;

export const CORETIME_DECIMALS = 12;
export const REGIONX_DECIMALS = 12;

export const CORETIME_TOKEN_UNIT = Math.pow(10, CORETIME_DECIMALS);
export const LISTING_DEPOSIT = 0;

/// Given that a timeslice is 8 minutes;
export const DAY_IN_TIMESLICES = 180;
export const WEEK_IN_TIMESLICES = DAY_IN_TIMESLICES * 7;
export const REGION_COLLECTION_ID = 42;

export const CORETIME_PARA_ID = 1005;
export const REGIONX_PARA_ID = 4459;

export const SAFE_XCM_VERSION = 3;

export const BROKER_PALLET_ID = 50;

export const POOLING_TASK_ID = 0;

export const NATIVE_ASSET_ID = 0;
export const RELAY_ASSET_ID = 1;
