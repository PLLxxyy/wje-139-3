import { Injectable, NotFoundException } from '@nestjs/common';
@Injectable()
export class BinLocationService {
  private readonly rows = [
    { id: 1, area: 'A', rack: 'R01', level: 2, column: 3, capacity: 100, occupancy: 76, storageRequirement: 'ColdChain', status: 'Occupied' },
    { id: 2, area: 'B', rack: 'R08', level: 1, column: 6, capacity: 200, occupancy: 34, storageRequirement: 'Normal', status: 'Available' },
    { id: 3, area: 'A', rack: 'R02', level: 3, column: 5, capacity: 150, occupancy: 140, storageRequirement: 'Normal', status: 'Occupied' },
    { id: 4, area: 'C', rack: 'R03', level: 1, column: 2, capacity: 80, occupancy: 10, storageRequirement: 'Hazardous', status: 'Available' },
  ];
  findAll() { return this.rows; }
  findOne(id: number) {
    const bin = this.rows.find(b => b.id === id);
    if (!bin) throw new NotFoundException('库位不存在');
    return bin;
  }
  create(payload: any) { const row = { ...payload, id: this.rows.length + 1 }; this.rows.push(row); return row; }
  updateOccupancy(id: number, delta: number) {
    const bin = this.findOne(id);
    const newOccupancy = bin.occupancy + delta;
    if (newOccupancy < 0) throw new Error('占用量不能为负数');
    if (newOccupancy > bin.capacity) throw new Error('超出库位容量上限');
    bin.occupancy = newOccupancy;
    bin.status = bin.occupancy >= bin.capacity ? 'Full' : bin.occupancy > 0 ? 'Occupied' : 'Available';
    return bin;
  }
}
