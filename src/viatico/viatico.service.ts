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

      if (!result || result.length === 0) {
        throw new Error('La consulta no devolvió resultados');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Viáticos');

      worksheet.columns = [
        { header: 'NÚMERO DE RECIBO', key: 'NUMERO_RECIBO', width: 20 },
        { header: 'NUM. OFI.', key: 'NUMERO_OFICIO', width: 20 },
        { header: 'NOMBRE DEL VIATICADO', key: 'NOMBRE_VIATICADO', width: 30 },
        { header: 'PARTIDA', key: 'PARTIDA', width: 15 },
        { header: 'PROVEEDOR', key: 'PROVEEDOR', width: 25 },
        { header: 'R.F.C.', key: '', width: 25 },
        { header: 'USO CFDI', key: '', width: 25 },
        { header: 'FECHA FAC/RECIBO', key: '', width: 15 },
        { header: 'XML/FÓLIO', key: 'XML_FOLIO', width: 20 },
        { header: 'DESCRIPCIÓN', key: 'CONCEPTO_VIATICO', width: 15 },
        { header: 'FECHA DE SPEI', key: 'FECHA_SPEI', width: 15 },
        { header: 'Nº CUENTA BANCARIA', key: '', width: 15 },
        { header: 'Nº SPEI', key: '', width: 15 },
        { header: 'SUBTOTAL', key: 'SUBTOTAL', width: 15,style: { numFmt: '"$"#,##0.00' } },
        { header: 'IVA', key: 'IVA', width: 15,style: { numFmt: '"$"#,##0.00' } },
        { header: 'ISR', key: '', width: 15 },
        { header: 'HOSPEDAJE 2%', key: '', width: 15 },
        { header: 'IEPS 8%', key: '', width: 15 },
        { header: 'IMPORTE TOTAL', key: 'IMPORTE_BUENA_POR', width: 25,style: { numFmt: '"$"#,##0.00' } },
        // { header: 'IMPORTE BUENA POR', key: '', width: 18, style: { numFmt: '"$"#,##0.00' } },
        { header: 'REINTEGRO', key: '', width: 15 },
        { header: 'REEMBOLSO', key: '', width: 15 },
        { header: 'TOTAL POR PQTE', key: '', width: 15 },
        { header: 'ENTREGO', key: '', width: 15 },

      ];

      worksheet.getRow(1).height = 50;

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'bf8f00' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      result.forEach((rowData) => {
        const importe = parseFloat(rowData.IMPORTE_BUENA_POR) || 0;

        const subtotal = +(importe / 1.16).toFixed(2);
        const iva = +(importe - subtotal).toFixed(2);

        worksheet.addRow({
          ...rowData,
          SUBTOTAL: subtotal,
          IVA: iva,
          IMPORTE_TOTAL: importe,
        });
      });


      const headerRow = worksheet.getRow(1);

      headerRow.eachCell((cell) => {
        if (cell.value === 'ISR') {
          cell.font = {
            bold: true,
            color: { argb: 'FF0000' },
          };
        }
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