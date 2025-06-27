import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ViaticosService } from './viatico.service';

@Controller('viaticos')
export class ViaticosController {
  constructor(private readonly viaticosService: ViaticosService) {}

  @Get('reporte-excel/:fechaInicio/:fechaFin/:filtroFolio')
  async generarReporteExcel(
    @Param('fechaInicio') fechaInicio: string,
    @Param('fechaFin') fechaFin: string,
    @Param('filtroFolio') filtroFolio: string,
    @Res() res: Response,
  ) {
    try {
      const workbook = await this.viaticosService.generarReporteExcel(
        fechaInicio,
        fechaFin,
        filtroFolio,
      );

      const fechaInicioFormatted = fechaInicio.replace(/-/g, '');
      const fechaFinFormatted = fechaFin.replace(/-/g, '');

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Reporte_Viaticos_${filtroFolio}_${fechaInicioFormatted}_a_${fechaFinFormatted}.xlsx`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error en el controlador:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
}
