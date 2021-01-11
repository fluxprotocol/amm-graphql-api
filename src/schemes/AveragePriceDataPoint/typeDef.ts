import { gql } from 'apollo-server';

const typeDef = gql`
    type AveragePriceForOutcome {
        outcome: Int
        price: String
    }

    type AveragePriceDataPoint {
        pointKey: String
        dataPoints: [AveragePriceForOutcome]
    }

    enum DateMetric {
        minute
        hour
        day
        week
        month
        year
    }

    extend type Query {
        getAveragePriceHistory(poolId: String!, beginTimestamp: String!, endTimestamp: String, dateMetric: DateMetric): [AveragePriceDataPoint]
        # getAveragePriceForDay(marketId: String!, beginTimestamp: String!): PriceDataPoint
    }
`;

export default typeDef;
