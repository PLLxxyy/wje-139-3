import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InboundService } from './inbound.service';
import { BinLocationService } from './binLocation.service';

describe('InboundService - 上架容量校验', () => {
  let inboundService: InboundService;
  let binLocationService: BinLocationService;

  beforeEach(() => {
    binLocationService = new BinLocationService();
    inboundService = new InboundService(binLocationService);
  });

  describe('shelfItem - 核心上架逻辑', () => {
    it('容量足够时成功上架并更新库位占用量', () => {
      const beforeBin = binLocationService.findOne(2);
      const beforeOccupancy = beforeBin.occupancy;
      const qty = 50;

      const result = inboundService.shelfItem(1, 1, 2);

      expect(result.item.shelved).toBe(true);
      expect(result.item.binLocationId).toBe(2);

      const afterBin = binLocationService.findOne(2);
      expect(afterBin.occupancy).toBe(beforeOccupancy + qty);
    });

    it('容量不足时抛出 BadRequestException，message 包含剩余量和需求量', () => {
      const bin = binLocationService.findOne(3);
      const remaining = bin.capacity - bin.occupancy;
      const requiredQty = 80;

      expect(remaining).toBeLessThan(requiredQty);

      try {
        inboundService.shelfItem(1, 2, 3);
        expect.fail('应该抛出 BadRequestException');
      } catch (e: any) {
        expect(e).toBeInstanceOf(BadRequestException);
        const message = typeof e.response === 'string' ? e.response : e.response?.message;
        expect(message).toContain('容量不足');
        expect(message).toContain(String(remaining));
        expect(message).toContain(String(requiredQty));
      }
    });

    it('入库单不存在时抛出 NotFoundException', () => {
      try {
        inboundService.shelfItem(999, 1, 2);
        expect.fail('应该抛出 NotFoundException');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
    });

    it('入库明细不存在时抛出 NotFoundException', () => {
      try {
        inboundService.shelfItem(1, 999, 2);
        expect.fail('应该抛出 NotFoundException');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
    });

    it('重复上架同一商品时抛出 BadRequestException', () => {
      inboundService.shelfItem(1, 1, 2);

      try {
        inboundService.shelfItem(1, 1, 2);
        expect.fail('应该抛出 BadRequestException');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(
          typeof (e as any).response === 'string'
            ? (e as any).response
            : (e as any).response?.message
        ).toContain('已上架');
      }
    });

    it('订单所有明细都上架后订单状态变为 Shelved', () => {
      const order1 = (inboundService as any).rows.find((o: any) => o.id === 1);
      const unShelvedCount = order1.items.filter((i: any) => !i.shelved).length;
      expect(unShelvedCount).toBeGreaterThan(0);

      inboundService.shelfItem(1, 1, 2);
      inboundService.shelfItem(1, 2, 4);

      const orderAfter = (inboundService as any).rows.find((o: any) => o.id === 1);
      expect(orderAfter.status).toBe('Shelved');
    });

    it('容量不足时库位占用量不变化', () => {
      const bin = binLocationService.findOne(3);
      const beforeOccupancy = bin.occupancy;

      try {
        inboundService.shelfItem(1, 2, 3);
      } catch {}

      const afterBin = binLocationService.findOne(3);
      expect(afterBin.occupancy).toBe(beforeOccupancy);
    });

    it('容量不足时明细不标记为已上架', () => {
      try {
        inboundService.shelfItem(1, 2, 3);
      } catch {}

      const order = (inboundService as any).rows.find((o: any) => o.id === 1);
      const item = order.items.find((i: any) => i.id === 2);
      expect(item.shelved).toBe(false);
    });
  });
});
