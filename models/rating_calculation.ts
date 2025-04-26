import * as TypeORM from 'typeorm';
import Model from './common';

declare var syzoj: any;

import Contest from './contest';
import RatingHistory from './rating_history';

@TypeORM.Entity()
export default class RatingCalculation extends Model {
    @TypeORM.PrimaryGeneratedColumn()
    id: number;

    @TypeORM.Index({})
    @TypeORM.Column({ nullable: true, type: 'integer' })
    contest_id: number;
    
    @TypeORM.Column({ default: false, type: 'boolean' })
    auto_calculated: boolean;

    contest?: Contest;

    async loadRelationships() {
        this.contest = await Contest.findById(this.contest_id);
    }

    async delete() {
        const histories = await RatingHistory.find({
            where: {
                rating_calculation_id: this.id
            }
        });
        for (const history of histories) {
            await history.loadRelationships();
            const user = history.user;
            await history.destroy();
            const ratingItem = await RatingHistory.findOne({
                where: {
                    user_id: user.id
                },
                order: {
                    rating_calculation_id: 'DESC'
                }
            });
            user.rating = ratingItem
                ? ratingItem.rating_after
                : syzoj.config.default.user.rating;
            await user.save();
        }
        
        // 将相关比赛的rated属性设置为false
        if (this.contest_id) {
            await this.loadRelationships();
            if (this.contest) {
                this.contest.rated = false;
                await this.contest.save();
                syzoj.log(`比赛 ${this.contest.id}: ${this.contest.title} 的rated属性已设置为false`);
            }
        }
        
        await this.destroy();
    }
}
