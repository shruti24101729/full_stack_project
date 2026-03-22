import { IPoolRepository } from '../ports/IPoolRepository';
import { CreatePoolInput, PoolAllocationResult } from '../domain/Pooling';

export class CreatePool {
  constructor(private readonly poolRepo: IPoolRepository) {}

  async execute(input: CreatePoolInput): Promise<PoolAllocationResult> {
    if (!input.year) {
      throw new Error('year is required.');
    }
    if (!input.members || input.members.length < 2) {
      throw new Error('A pool requires at least 2 members.');
    }
    return this.poolRepo.create(input);
  }
}

export class GetAllPools {
  constructor(private readonly poolRepo: IPoolRepository) {}

  async execute() {
    return this.poolRepo.findAll();
  }
}
