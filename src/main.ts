import { ApolloServer, gql } from 'apollo-server-express';
import { Db } from 'mongodb';
import express from 'express';
import * as account from './schemes/Account';
import * as pool from './schemes/Pool';
import * as tokenInfo from './schemes/TokenInfo';
import * as balances from './schemes/Balance';
import * as poolBalances from './schemes/PoolBalance';
import * as poolTokenFeesEarned from './schemes/PoolTokenFeesEarned';
import * as averagePriceDataPoint from './schemes/AveragePriceDataPoint';
import bootDatabase from './database';
import { APP_PORT } from './constants';

export interface Context {
    db: Db;
}

async function main() {
    console.info('🚀 Booting GraphQL server..');

    const database = await bootDatabase();
    const typeDef = gql`
        type Query
    `;

    const server = new ApolloServer({
        uploads: true,
        typeDefs: [
            typeDef,
            pool.typeDef,
            tokenInfo.typeDef,
            balances.typeDef,
            account.typeDef,
            poolBalances.typeDef,
            poolTokenFeesEarned.typeDef,
            averagePriceDataPoint.typeDef,
        ],
        resolvers: [
            pool.resolvers,
            account.resolvers,
            averagePriceDataPoint.resolvers,
        ],
        tracing: true,
        debug: true,
        context: {
            db: database,
        }
    });

    const app = express();
    server.applyMiddleware({ app });
    app.use(express.static('public', {
        setHeaders: (res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
    }));

    app.listen(APP_PORT, () => {
        console.info(`🚀 GraphQL listening on ${process.env.APP_PORT}`);
    });
}

main();
