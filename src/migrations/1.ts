import { Db } from "mongodb";
import { Claim } from "../models/Claim";
import { Migration } from "./Migration";

const TARGET_COLLECTION = 'user_balances';

export class Migration1 implements Migration {
    id: string = 'remove_cap_date_and_replace_with_creation_date_on_user_balances';

    async execute(db: Db) {
        const docs = await db.collection(TARGET_COLLECTION).find<Claim>({
            cap_creation_date: {
                $exists: true,
            }
        }).toArray();

        for (const doc of docs) {
            const capDate = doc.cap_creation_date;
            await db.collection(TARGET_COLLECTION).updateOne({
                // @ts-ignore
                _id: doc._id,
            }, {
                $set: {
                    creation_date: capDate.getTime().toString(),
                },
                $unset: {
                    cap_creation_date: '',
                }
            });
        }
    }
}
