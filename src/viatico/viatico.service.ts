import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Viatico } from './entities/viatico.entity';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ViaticosService {
  constructor(
    @InjectRepository(Viatico)
    private viaticosRepository: Repository<Viatico>,
  ) { }

  async generarReporteExcel(
    fechaInicio: string,
    fechaFin: string,
    filtroFolio: string,
  ) {
    try {

      const query = `
        SELECT DISTINCT
          s.oficioComision AS NUMERO_OFICIO,
          gc.folioGastoCorriente AS NUMERO_RECIBO,
          CONCAT(pg.nombre, ' ', pg.paterno, ' ', pg.materno) AS NOMBRE_VIATICADO,
          (SELECT p.clave FROM partida p 
           JOIN gastopartida gp ON p.idPartida = gp.idPartida 
           WHERE gp.idGastoCorriente = gc.idGastoCorriente LIMIT 1) AS PARTIDA,
           (SELECT cv.conceptoViatico 
        FROM comprobantes comp
           JOIN gastopartida gp ON comp.idGastoPartida = gp.idGastoPartida
           JOIN conceptoviatico cv ON gp.idConceptoViatico = cv.idConceptoViatico
           WHERE comp.folioComprobante = c.folioComprobante
           LIMIT 1) AS CONCEPTO_VIATICO, 
          c.proveedor AS PROVEEDOR,
          c.folioComprobante AS XML_FOLIO,
          c.fecha AS FECHA_SPEI,
          c.importe AS IMPORTE_BUENA_POR
        FROM 
          gastocorriente gc
        LEFT JOIN 
          comprobantes c ON gc.idComprobacion = c.idComprobacion
        JOIN 
          solicitud s ON gc.idSolicitud = s.idSolicitud
        JOIN 
          personagasto pg ON gc.idPersonaGasto = pg.idPersonaGasto
        WHERE 
          c.fecha BETWEEN ? AND ?
          AND gc.folioGastoCorriente LIKE ?
        ORDER BY 
          gc.folioGastoCorriente;
      `;

      const params = [
        fechaInicio,
        fechaFin,
        `%${filtroFolio}%`
      ];

      const result = await this.viaticosRepository.query(query, params);

      console.log('AQUI ESTA EL QUERY :', query);
      console.log('AQUI ESTAN LOS PARAMETROS :', params);

      if (!result || result.length === 0) {
        throw new Error('La consulta no devolvió resultados');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Viáticos');

      worksheet.columns = [
        { header: 'NÚMERO DE OFICIO', key: 'NUMERO_OFICIO', width: 20 },
        { header: 'NÚMERO DE RECIBO', key: 'NUMERO_RECIBO', width: 20 },
        { header: 'NOMBRE DEL VIATICADO', key: 'NOMBRE_VIATICADO', width: 30 },
        { header: 'PARTIDA', key: 'PARTIDA', width: 15 },
        { header: 'CONCEPTO VIATICO', key: 'CONCEPTO_VIATICO', width: 15 },
        { header: 'PROVEEDOR', key: 'PROVEEDOR', width: 25 },
        { header: 'FOLIO XML', key: 'XML_FOLIO', width: 20 },
        { header: 'FECHA SPEI', key: 'FECHA_SPEI', width: 15 },
        { header: 'IMPORTE ($)', key: 'IMPORTE_BUENA_POR', width: 18, style: { numFmt: '"$"#,##0.00' } }
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4F81BD' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      result.forEach(row => {
        worksheet.addRow(row);
      });

      worksheet.autoFilter = {
        from: {
          row: 1,
          column: 1,
        },
        to: {
          row: 1,
          column: worksheet.columns.length,
        },
      };

      worksheet.views = [
        { state: 'frozen', ySplit: 1 }
      ];

      return workbook;

    } catch (error) {
      throw new Error(`Error al generar reporte: ${error.message}`);
    }
  }
}