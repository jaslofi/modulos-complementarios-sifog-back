import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('gastocorriente')
export class Viatico {
  @PrimaryGeneratedColumn()
  idGastoCorriente: number;

  @Column()
  folioGastoCorriente: string;

  @Column()
  fecha: Date;

  @Column({ name: 'idSolicitud' })
  idSolicitud: number;

  @Column({ name: 'idPersonaGasto' })
  idPersonaGasto: number;

  @Column({ name: 'idComprobacion' })
  idComprobacion: number;
}