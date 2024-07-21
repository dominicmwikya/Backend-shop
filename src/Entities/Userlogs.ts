import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ipAddress: string;

  @Column()
  urlAccessed: string;
  
  @Column()
  os: string;

  @Column()
  browser: string;

  @Column({ nullable : true})
  userId: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
