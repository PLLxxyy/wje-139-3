import { describe, it, expect, vi, beforeEach } from 'vitest';
import { request } from './request';

describe('request 工具错误 message 解析', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('正常 200 响应返回 JSON 数据', async () => {
    const mockData = { id: 1, name: 'test' };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as unknown as Response);

    const result = await request('/api/test');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('解析 NestJS 标准错误格式 { statusCode, message, error }', async () => {
    const errorBody = {
      statusCode: 400,
      message: '库位容量不足，剩余 10，需要 50',
      error: 'Bad Request',
    };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => errorBody,
    } as unknown as Response);

    await expect(request('/api/test')).rejects.toThrow('库位容量不足，剩余 10，需要 50');
  });

  it('解析 message 为数组的校验错误格式', async () => {
    const errorBody = {
      statusCode: 400,
      message: ['字段A不能为空', '字段B格式错误'],
      error: 'Bad Request',
    };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => errorBody,
    } as unknown as Response);

    await expect(request('/api/test')).rejects.toThrow('字段A不能为空; 字段B格式错误');
  });

  it('当无 message 时回退使用 error 字段', async () => {
    const errorBody = {
      statusCode: 500,
      error: 'Internal Server Error',
    };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => errorBody,
    } as unknown as Response);

    await expect(request('/api/test')).rejects.toThrow('Internal Server Error');
  });

  it('当响应体不是 JSON 时使用纯文本', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => { throw new Error('parse failed'); },
      text: async () => 'Not Found: 资源不存在',
    } as unknown as Response);

    await expect(request('/api/test')).rejects.toThrow('Not Found: 资源不存在');
  });

  it('当 JSON 和文本都解析失败时使用默认提示', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => { throw new Error('parse failed'); },
      text: async () => { throw new Error('text read failed'); },
    } as unknown as Response);

    await expect(request('/api/test')).rejects.toThrow('请求失败 (502)');
  });

  it('容量不足错误场景：服务端返回业务 message 正确透传', async () => {
    const errorBody = {
      statusCode: 400,
      message: '库位容量不足，剩余 24，需要 80',
      error: 'Bad Request',
    };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => errorBody,
    } as unknown as Response);

    try {
      await request('/api/inbound-orders/1/items/2/shelf', {
        method: 'PUT',
        body: JSON.stringify({ binLocationId: 3 }),
      });
      expect.fail('应该抛出错误');
    } catch (e: any) {
      expect(e.message).toBe('库位容量不足，剩余 24，需要 80');
      expect(e.message).toContain('剩余');
      expect(e.message).toContain('需要');
    }
  });
});
