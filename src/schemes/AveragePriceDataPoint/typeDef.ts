import { gql } from 'apollo-server';

const typeDef = gql`
    type PriceForOutcome {
        outcome: Int
        price: String
    }

    type PriceDataPoint {
        pointKey: String
        dataPoints: [PriceForOutcome]
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
        getPriceHistory(poolId: String!, beginTimestamp: String!, endTimestamp: String, dateMetric: DateMetric): [PriceDataPoint]
        getPriceForDay(poolId: String!, beginTimestamp: String!): PriceDataPoint
    }
`;

export default typeDef;
