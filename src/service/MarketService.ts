import Big from "big.js";
import { Db, FilterQuery } from "mongodb";
import { Market } from "../models/Market";
import { PaginationFilters, PaginationResult } from "../models/PaginationResult";
import { getSwapCursorByMarketId } from "./SwapService";

const MARKETS_COLLECTION_NAME = 'markets';

export interface MarketFilters extends PaginationFilters {
    categories: string[];
    expired?: boolean;
    finalized?: boolean;
    sortByVolume?: boolean;
}

export async function getMarkets(db: Db, filterOptions?: Partial<MarketFilters>): Promise<PaginationResult<Market>> {
    const query: FilterQuery<Market> = {};
    const collection = db.collection(MARKETS_COLLECTION_NAME);

    const filters: MarketFilters = {
        limit: 10,
        offset: 0,
        categories: [],
        sortByVolume: false,
        ...filterOptions,
    };

    if (filters.categories.length > 0) {
        query.categories = {
            $in: filters.categories,
        };
    }

    if (typeof filters.finalized !== 'undefined') {
        query.finalized = filters.finalized;
    }

    // Only filter out the expired if the user wants them (resolution for example)
    if (typeof filters.expired !== 'undefined') {
        const now = new Date().getTime();

        if (!filters.expired) {
            query.end_time = {
                $gt: now.toString(),
            };
        } else {
            query.end_time = {
                $lt: now.toString(),
            };
        }
    }

    const pipeline: object[] = [{
        $match: query,
    }];

    if (filters.sortByVolume) {
        pipeline.push(...[
            // Take all the swaps
            {
                $lookup: {
                    from: 'swaps',
                    localField: 'id',
                    foreignField: 'pool_id',
                    as: 'swaps',
                }
            },
            // Take all the pools
            {
                $lookup: {
                    from: 'pools',
                    localField: 'id',
                    foreignField: 'id',
                    as: 'pool',
                }
            },
            // Only show 1 pool (a market cannot have multiple pools)
            {
                $addFields: {
                    pool: {
                        '$arrayElemAt': [ '$pool', 0 ],
                    }
                },
            },
            {
                $addFields: {
                    volume: {
                        $function: {
                            // We use the denom stored in the pool or just assume it's denom in 24 decimals
                            // minus 2 (/ divided by 100) for decimals
                            body: `function(swaps, pool) {
                                const tokenDenom = (pool.collateral_denomination ? pool.collateral_denomination.length - 1 : 24) - 2;
                                const swapsAmount = swaps.map(i => {
                                    if (i.type === 'buy') {
                                        return parseInt(i.input.slice(0, -tokenDenom));
                                    }

                                    return parseInt(i.output.slice(0, -tokenDenom));
                                });

                                return swapsAmount.filter(i => !Number.isNaN(i)).reduce((p, c) => p + c, 0) / 100;
                        }`,
                            args: ['$swaps', '$pool'],
                            lang: "js",
                        },
                    },
                }
            },
            {
                $unset: ['swaps'],
            },
            {
                $sort: {
                    volume: -1,
                }
            }
        ]);
    }

    const cursor = collection.aggregate(pipeline).limit(filters.limit).skip(filters.offset);

    return {
        items: await cursor.toArray(),
        total: await collection.countDocuments(query),
    };
}

export async function getMarketById(db: Db, id: string): Promise<Market | null> {
    try {
        const collection = db.collection(MARKETS_COLLECTION_NAME);
        const query: FilterQuery<Market> = {
            id,
        };

        return collection.findOne<Market>(query);
    } catch (error) {
        console.error('[getMarketById]', error);
        return null;
    }
}

export async function getVolumeForMarket(db: Db, marketId: string): Promise<string> {
    try {
        const swapCursor = getSwapCursorByMarketId(db, marketId);
        let totalVolume = new Big(0);

        while (await swapCursor.hasNext()) {
            const swap = await swapCursor.next();
            if (!swap) continue;

            if (swap.type === 'buy') {
                totalVolume = totalVolume.add(swap.input);
            } else {
                totalVolume = totalVolume.add(swap.output);
            }
        }

        return totalVolume.toString();
    } catch (error) {
        console.error('[getVolumeForMarket]', error);
        return '0';
    }
}
