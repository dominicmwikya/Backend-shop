// email.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class Email {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    sender: string;

    @Column()
    recipient: string;

    @Column()
    subject: string;

    @Column('text')
    content: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    timestamp: Date;
}
