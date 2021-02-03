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
}

export async function getMarkets(db: Db, filterOptions?: Partial<MarketFilters>): Promise<PaginationResult<Market>> {
    const query: FilterQuery<Market> = {};
    const collection = db.collection(MARKETS_COLLECTION_NAME);

    const filters: MarketFilters = {
        limit: 10,
        offset: 0,
        categories: [],
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

    const cursor2 = collection.aggregate([
        {
            $match: query,
        },
        // Find all buy swaps
        {
            $lookup: {
                from: 'swaps',
                // localField: 'pool_id',
                // foreignField: 'id',
                as: 'buySwaps',
                pipeline: [
                    {
                        $match: {
                            // $expr: {
                            //     pool_id: '$$id',
                            // },
                            pool_id: '$id',
                            type: 'buy',
                        }
                    }
                ],
            }
        },
        // Find all sell swaps
        {
            $lookup: {
                from: 'swaps',
                // localField: 'pool_id',
                // foreignField: 'id',
                as: 'sellSwaps',
                pipeline: [
                    {
                        $match: {
                            // $expr: {
                                pool_id: '$id',
                            // },
                            type: 'sell'
                        }
                    }
                ],
            }
        },
        {
            $addFields: {
                volume: {
                    $function: {
                        body: `function(buySwaps, sellSwaps) {
                            const buyInputs = buySwaps.map(i => parseInt(i.input.slice(0, -18)));
                            const sellInputs = sellSwaps.map(i => parseInt(i.output.slice(0, -18)));
                            let volume = 0;

                            volume += buyInputs.filter(i => !Number.isNaN(i)).reduce((p, c) => p + c, 0);
                            volume += sellInputs.filter(i => !Number.isNaN(i)).reduce((p, c) => p + c, 0);

                            return volume;
                        }`,
                        args: ['$buySwaps', '$sellSwaps'],
                        lang: "js",
                    },
                },
            }
        },
        // {
        //     $unset: ['buySwaps', 'sellSwaps'],
        // }
    ]);

    const r = await cursor2.toArray();

    r.forEach((i) => {
        console.log(i);
    });

    const cursor = collection.find<Market>(query, {
        sort: {
            cap_creation_date: -1,
        }
    }).limit(filters.limit).skip(filters.offset);

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
