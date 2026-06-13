import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { BinLocationService } from './binLocation.service';

describe('BinLocationService - 库位容量管理', () => {
  let service: BinLocationService;

  beforeEach(() => {
    service = new BinLocationService();
  });

  describe('findAll / findOne', () => {
    it('findAll 返回所有库位', () => {
      const all = service.findAll();
      expect(all.length).toBeGreaterThan(0);
    });

    it('findOne 按 ID 返回正确库位', () => {
      const bin = service.findOne(1);
      expect(bin.id).toBe(1);
      expect(bin.area).toBeDefined();
    });

    it('findOne 不存在时抛出 NotFoundException', () => {
      expect(() => service.findOne(9999)).toThrow(NotFoundException);
    });
  });

  describe('updateOccupancy - 占用量更新', () => {
    it('增加占用量成功', () => {
      const before = service.findOne(2);
      const beforeOcc = before.occupancy;

      const after = service.updateOccupancy(2, 10);
      expect(after.occupancy).toBe(beforeOcc + 10);
    });

    it('减少占用量成功', () => {
      const before = service.findOne(1);
      const beforeOcc = before.occupancy;

      const after = service.updateOccupancy(1, -20);
      expect(after.occupancy).toBe(beforeOcc - 20);
    });

    it('超出容量上限时抛出错误', () => {
      const bin = service.findOne(1);
      const delta = bin.capacity - bin.occupancy + 1;

      expect(() => service.updateOccupancy(1, delta)).toThrow('超出库位容量上限');
    });

    it('占用量不能为负数', () => {
      const bin = service.findOne(1);
      const delta = -bin.occupancy - 1;

      expect(() => service.updateOccupancy(1, delta)).toThrow('占用量不能为负数');
    });

    it('占用满后状态变为 Full', () => {
      const bin = service.findOne(4);
      const delta = bin.capacity - bin.occupancy;

      const result = service.updateOccupancy(4, delta);
      expect(result.status).toBe('Full');
      expect(result.occupancy).toBe(bin.capacity);
    });

    it('空库位状态为 Available', () => {
      service.findOne(1);
      service.updateOccupancy(1, -76);
      const bin = service.findOne(1);
      expect(bin.occupancy).toBe(0);
      expect(bin.status).toBe('Available');
    });

    it('部分占用状态为 Occupied', () => {
      const bin = service.findOne(4);
      expect(bin.occupancy).toBeGreaterThan(0);
      expect(bin.occupancy).toBeLessThan(bin.capacity);
      expect(bin.status).toBe('Occupied');
    });

    it('占用量减少到 0 时状态变回 Available', () => {
      const bin = service.findOne(2);
      service.updateOccupancy(2, -bin.occupancy);
      const result = service.findOne(2);
      expect(result.occupancy).toBe(0);
      expect(result.status).toBe('Available');
    });
  });
});
