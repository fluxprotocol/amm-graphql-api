import { gql } from 'apollo-server';

const typeDef = gql`
    type PoolTokenFeesEarned {
        outcomeId: Int
        poolId: String
        fees: String
        balance: String

        market: Market
    }
`;

export default typeDef;
