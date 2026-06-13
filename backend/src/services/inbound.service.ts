import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BinLocationService } from './binLocation.service';

@Injectable()
export class InboundService {
  constructor(private readonly binLocationService: BinLocationService) {}

  private readonly rows: any[] = [
    {
      id: 1,
      orderNo: 'INB-20260612-0001',
      ownerId: 1,
      supplier: '华东供应商',
      eta: '2026-06-12',
      ata: '2026-06-12',
      status: 'QCInProgress',
      qcInspectorId: 2,
      keeperId: 3,
      remark: '优先质检',
      items: [
        { id: 1, productId: 1, batchNo: 'B202606', expectedQty: 120, actualQty: 50, qcResult: 'Pass', binLocationId: 0, shelved: false },
        { id: 2, productId: 2, batchNo: 'B202607', expectedQty: 80, actualQty: 80, qcResult: 'Pass', binLocationId: 0, shelved: false },
      ]
    },
    {
      id: 2,
      orderNo: 'INB-20260613-0002',
      ownerId: 1,
      supplier: '华南供应商',
      eta: '2026-06-13',
      ata: '2026-06-13',
      status: 'Shelved',
      qcInspectorId: 2,
      keeperId: 3,
      remark: '',
      items: [
        { id: 3, productId: 3, batchNo: 'B202608', expectedQty: 30, actualQty: 30, qcResult: 'Pass', binLocationId: 1, shelved: true },
      ]
    }
  ];

  findAll() { return this.rows; }
  create(payload: any) { const row = { ...payload, id: this.rows.length + 1 }; this.rows.push(row); return row; }

  shelfItem(orderId: number, itemId: number, binLocationId: number) {
    const order = this.rows.find(o => o.id === orderId);
    if (!order) throw new NotFoundException('入库单不存在');

    const item = order.items.find((i: any) => i.id === itemId);
    if (!item) throw new NotFoundException('入库明细不存在');

    if (item.shelved) throw new BadRequestException('该商品已上架');

    const bin = this.binLocationService.findOne(binLocationId);
    const remainingCapacity = bin.capacity - bin.occupancy;

    if (remainingCapacity < item.actualQty) {
      throw new BadRequestException(
        `库位容量不足，剩余 ${remainingCapacity}，需要 ${item.actualQty}`
      );
    }

    this.binLocationService.updateOccupancy(binLocationId, item.actualQty);

    item.binLocationId = binLocationId;
    item.shelved = true;

    const allShelved = order.items.every((i: any) => i.shelved);
    if (allShelved) {
      order.status = 'Shelved';
    }

    return { order, item };
  }
}
