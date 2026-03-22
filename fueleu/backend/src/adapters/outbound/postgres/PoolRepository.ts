import { Pool } from 'pg';
import { IPoolRepository } from '../../../core/ports/IPoolRepository';
import { Pool as PoolEntity, CreatePoolInput, PoolAllocationResult, PoolMember, allocatePool } from '../../../core/domain/Pooling';

export class PostgresPoolRepository implements IPoolRepository {
  constructor(private readonly db: Pool) {}

  async create(input: CreatePoolInput): Promise<PoolAllocationResult> {
    const allocatedMembers = allocatePool(input.members);
    const poolSum = allocatedMembers.reduce((sum, m) => sum + m.cbBefore, 0);

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const poolResult = await client.query(
        'INSERT INTO pools (year, pool_sum) VALUES ($1, $2) RETURNING id',
        [input.year, poolSum]
      );
      const poolId = poolResult.rows[0].id as string;

      for (const member of allocatedMembers) {
        await client.query(
          'INSERT INTO pool_members (pool_id, ship_id, cb_before, cb_after) VALUES ($1,$2,$3,$4)',
          [poolId, member.shipId, member.cbBefore, member.cbAfter]
        );
      }

      await client.query('COMMIT');

      return {
        poolId,
        year: input.year,
        poolSum,
        members: allocatedMembers,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<PoolEntity | null> {
    const poolResult = await this.db.query(
      'SELECT * FROM pools WHERE id = $1',
      [id]
    );
    if (!poolResult.rows[0]) return null;

    const membersResult = await this.db.query(
      'SELECT * FROM pool_members WHERE pool_id = $1',
      [id]
    );

    const members: PoolMember[] = membersResult.rows.map((r) => ({
      shipId: r.ship_id as string,
      cbBefore: Number(r.cb_before),
      cbAfter: Number(r.cb_after),
    }));

    return {
      id: poolResult.rows[0].id as string,
      year: Number(poolResult.rows[0].year),
      members,
      poolSum: Number(poolResult.rows[0].pool_sum),
      createdAt: new Date(poolResult.rows[0].created_at as string),
    };
  }

  async findAll(): Promise<PoolEntity[]> {
    const poolsResult = await this.db.query(
      'SELECT * FROM pools ORDER BY created_at DESC'
    );

    const pools: PoolEntity[] = [];
    for (const row of poolsResult.rows) {
      const pool = await this.findById(row.id as string);
      if (pool) pools.push(pool);
    }
    return pools;
  }
}
