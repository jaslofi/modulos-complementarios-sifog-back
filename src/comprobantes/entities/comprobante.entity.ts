import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('comprobantes')
export class Comprobante {
  @PrimaryGeneratedColumn({ name: 'idComprobante' })
  id: number;

  @Column({ name: 'folioComprobante' })
  folioComprobante: string;

  @Column()
  url: string;

}