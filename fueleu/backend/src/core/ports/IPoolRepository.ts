import { Pool, CreatePoolInput, PoolAllocationResult } from '../domain/Pooling';

export interface IPoolRepository {
  create(input: CreatePoolInput): Promise<PoolAllocationResult>;
  findById(id: string): Promise<Pool | null>;
  findAll(): Promise<Pool[]>;
}
