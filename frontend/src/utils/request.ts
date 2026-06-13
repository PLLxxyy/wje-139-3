export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }, ...init });
  if (!response.ok) {
    let errorMessage = `请求失败 (${response.status})`;
    try {
      const errorBody = await response.json();
      if (typeof errorBody === 'object' && errorBody !== null) {
        if (typeof errorBody.message === 'string') {
          errorMessage = errorBody.message;
        } else if (Array.isArray(errorBody.message) && errorBody.message.length > 0) {
          errorMessage = errorBody.message.join('; ');
        } else if (typeof errorBody.error === 'string') {
          errorMessage = errorBody.error;
        }
      }
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {}
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}
