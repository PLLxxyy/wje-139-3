import { describe, it, expect } from 'vitest';
import {
  getBinUsagePercent,
  getRemainingCapacity,
  isCapacitySufficient,
  isHighUsage,
  canShelf,
  getCapacityStatus,
} from './capacity';

describe('容量校验工具函数', () => {
  describe('getBinUsagePercent - 计算库位使用率', () => {
    it('正常使用率计算', () => {
      expect(getBinUsagePercent({ capacity: 100, occupancy: 50 })).toBe(50);
      expect(getBinUsagePercent({ capacity: 200, occupancy: 30 })).toBe(15);
      expect(getBinUsagePercent({ capacity: 150, occupancy: 140 })).toBeCloseTo(93.333);
    });

    it('容量为 0 时不报错，返回 0', () => {
      expect(getBinUsagePercent({ capacity: 0, occupancy: 0 })).toBe(0);
    });

    it('占用量等于容量时返回 100%', () => {
      expect(getBinUsagePercent({ capacity: 80, occupancy: 80 })).toBe(100);
    });

    it('空库位返回 0%', () => {
      expect(getBinUsagePercent({ capacity: 100, occupancy: 0 })).toBe(0);
    });
  });

  describe('getRemainingCapacity - 计算剩余容量', () => {
    it('正常剩余容量计算', () => {
      expect(getRemainingCapacity({ capacity: 100, occupancy: 30 })).toBe(70);
      expect(getRemainingCapacity({ capacity: 200, occupancy: 180 })).toBe(20);
    });

    it('已满库位剩余 0', () => {
      expect(getRemainingCapacity({ capacity: 100, occupancy: 100 })).toBe(0);
    });
  });

  describe('isCapacitySufficient - 校验容量是否足够', () => {
    it('容量足够返回 true', () => {
      expect(isCapacitySufficient({ capacity: 100, occupancy: 30 }, 50)).toBe(true);
      expect(isCapacitySufficient({ capacity: 100, occupancy: 50 }, 50)).toBe(true);
    });

    it('容量不足返回 false', () => {
      expect(isCapacitySufficient({ capacity: 100, occupancy: 80 }, 50)).toBe(false);
      expect(isCapacitySufficient({ capacity: 100, occupancy: 100 }, 1)).toBe(false);
    });

    it('库位为 null/undefined 时返回 false', () => {
      expect(isCapacitySufficient(null, 10)).toBe(false);
      expect(isCapacitySufficient(undefined, 10)).toBe(false);
    });

    it('上架场景：剩余 24 但需要 80，返回 false', () => {
      expect(isCapacitySufficient({ capacity: 150, occupancy: 126 }, 80)).toBe(false);
    });

    it('上架场景：剩余 166 但需要 50，返回 true', () => {
      expect(isCapacitySufficient({ capacity: 200, occupancy: 34 }, 50)).toBe(true);
    });
  });

  describe('isHighUsage - 判断是否高负荷(>90%)', () => {
    it('使用率超过 90% 返回 true', () => {
      expect(isHighUsage({ capacity: 150, occupancy: 140 })).toBe(true);
      expect(isHighUsage({ capacity: 100, occupancy: 91 })).toBe(true);
    });

    it('使用率不超过 90% 返回 false', () => {
      expect(isHighUsage({ capacity: 100, occupancy: 90 })).toBe(false);
      expect(isHighUsage({ capacity: 200, occupancy: 34 })).toBe(false);
    });

    it('可自定义阈值', () => {
      expect(isHighUsage({ capacity: 100, occupancy: 75 }, 70)).toBe(true);
      expect(isHighUsage({ capacity: 100, occupancy: 70 }, 70)).toBe(false);
    });
  });

  describe('canShelf - 判断是否可以上架', () => {
    it('选择了库位且容量充足时可以上架', () => {
      const bin = { capacity: 200, occupancy: 34 };
      expect(canShelf(2, bin, 50)).toBe(true);
    });

    it('未选择库位时不能上架', () => {
      const bin = { capacity: 200, occupancy: 34 };
      expect(canShelf(null, bin, 50)).toBe(false);
    });

    it('容量不足时不能上架', () => {
      const bin = { capacity: 150, occupancy: 140 };
      expect(canShelf(3, bin, 50)).toBe(false);
    });

    it('库位为空时不能上架', () => {
      expect(canShelf(1, null, 50)).toBe(false);
      expect(canShelf(1, undefined, 50)).toBe(false);
    });

    it('库位已选但容量刚好用完的场景', () => {
      const bin = { capacity: 100, occupancy: 50 };
      expect(canShelf(1, bin, 50)).toBe(true);
    });
  });

  describe('getCapacityStatus - 获取容量状态', () => {
    it('空库位返回 Available', () => {
      expect(getCapacityStatus({ capacity: 100, occupancy: 0 })).toBe('Available');
    });

    it('部分占用返回 Occupied', () => {
      expect(getCapacityStatus({ capacity: 100, occupancy: 50 })).toBe('Occupied');
    });

    it('已满返回 Full', () => {
      expect(getCapacityStatus({ capacity: 100, occupancy: 100 })).toBe('Full');
    });
  });
});
