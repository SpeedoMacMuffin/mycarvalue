import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { CreateReportDto } from './dtos/create-report.dto';
import { GetEstimateDto } from './dtos/get-estimate.dto';
import { Report } from './report.entity';

@Injectable()
export class ReportsService {
  constructor(@InjectRepository(Report) private report: Repository<Report>) {}

  createEstimate({ make, model, year, mileage, lng, lat }: GetEstimateDto) {
    return this.report
      .createQueryBuilder()
      .select('AVG(price)', 'price')
      .where('make = :make', { make })
      .andWhere('model = :model', { model })
      .andWhere('lng - :lng BETWEEN -5 AND 5', { lng })
      .andWhere('lat - :lat BETWEEN -5 AND 5', { lat })
      .andWhere('year - :year BETWEEN -3 AND 3', { year })
      .andWhere('approved IS TRUE')
      .orderBy('ABS(mileage - :milage)', 'DESC')
      .setParameters({ mileage })
      .limit(3)
      .getRawOne();
  }

  create(reportDto: CreateReportDto, user: User) {
    const report = this.report.create(reportDto);
    report.user = user;

    return this.report.save(report);
  }

  async changeApproval(id: string, approved: boolean) {
    const report = await this.report.findOne(id);

    if (!report) {
      throw new NotFoundException('report not found');
    }
    report.approved = approved;

    return this.report.save(report);
  }
}
