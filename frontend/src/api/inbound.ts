import { request } from '../utils/request';
import { apiPaths } from '../constants/apiPaths';
export const inboundApi = {
  list: <T>() => request<T[]>(apiPaths.inbound),
  shelfItem: (orderId: number, itemId: number, binLocationId: number) =>
    request(`${apiPaths.inbound}/${orderId}/items/${itemId}/shelf`, {
      method: 'PUT',
      body: JSON.stringify({ binLocationId }),
    }),
};
