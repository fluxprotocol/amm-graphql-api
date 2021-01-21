import { Db, FilterQuery } from "mongodb";
import { Market } from "../models/Market";
import { PaginationFilters, PaginationResult } from "../models/PaginationResult";

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
        limit: 0,
        offset: 0,
        categories: [],
        ...filterOptions,
    };

    if (filters.categories.length > 0) {
        query.categories = {
            $in: filters.categories,
        };
    }

    query.finalized = filters.finalized;

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

export async function getMarketById(db: Db, id: number): Promise<Market | null> {
    try {
        const collection = db.collection(MARKETS_COLLECTION_NAME);
        const query: FilterQuery<Market> = {
            id,
        };

        const r = await collection.findOne<Market>(query);

        return collection.findOne<Market>(query);
    } catch (error) {
        console.error('[getMarketById]', error);
        return null;
    }
}
