import {
  EventSubscriber,
  EntitySubscriberInterface,
  SelectQueryBuilder,
  LoadEvent,
} from 'typeorm';
import { BaseCollection } from '../entity/base.entity';

@EventSubscriber()
export class SoftDeleteSubscriber
  implements EntitySubscriberInterface<BaseCollection>
{
  listenTo() {
    return BaseCollection;
  }

  afterLoad(entity: BaseCollection, event?: LoadEvent<BaseCollection>): void {
    if (event?.queryRunner) {
      const queryBuilder = event.queryRunner.manager.createQueryBuilder();
      this.addSoftDeleteCondition(queryBuilder);
    }
  }

  private addSoftDeleteCondition(
    queryBuilder: SelectQueryBuilder<unknown>,
  ): void {
    const alias = queryBuilder.alias;
    if (alias) {
      queryBuilder.andWhere(`${alias}.active = :active`, { active: true });
    }
  }
}
