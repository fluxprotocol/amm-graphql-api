import { gql } from 'apollo-server';

const typeDef = gql`
    type PoolTokenFeesEarned {
        outcomeId: Int
        poolId: String
        fees: String
    }
`;

export default typeDef;
