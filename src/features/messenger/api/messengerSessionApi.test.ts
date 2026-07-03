import { beforeEach, describe, expect, it, vi } from 'vitest';
import messengerHttp from './messengerHttp';
import { messengerSessionApi } from './messengerSessionApi';

vi.mock('./messengerHttp', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

describe('messengerSessionApi (URL/method/body contract)', () => {
  beforeEach(() => {
    vi.mocked(messengerHttp.get).mockReset();
    vi.mocked(messengerHttp.post).mockReset();
  });

  it('opens a session with the peer id in the body', async () => {
    vi.mocked(messengerHttp.post).mockResolvedValue({ data: { id: 's1' } } as never);
    const result = await messengerSessionApi.open('peer-1');
    expect(messengerHttp.post).toHaveBeenCalledWith('/chat-sessions', { peerUserId: 'peer-1' });
    expect(result).toEqual({ id: 's1' });
  });

  it('lists sessions at /chat-sessions', async () => {
    vi.mocked(messengerHttp.get).mockResolvedValue({ data: [] } as never);
    await messengerSessionApi.list();
    expect(messengerHttp.get).toHaveBeenCalledWith('/chat-sessions');
  });

  it('pages messages with beforeSeq + limit', async () => {
    vi.mocked(messengerHttp.get).mockResolvedValue({ data: [] } as never);
    await messengerSessionApi.messages('s1', 42, 50);
    expect(messengerHttp.get).toHaveBeenCalledWith('/chat-sessions/s1/messages', {
      params: { beforeSeq: 42, limit: 50 },
    });
  });

  it('sends a message body', async () => {
    vi.mocked(messengerHttp.post).mockResolvedValue({ data: { id: 'm1' } } as never);
    await messengerSessionApi.send('s1', 'hi');
    expect(messengerHttp.post).toHaveBeenCalledWith('/chat-sessions/s1/messages', { body: 'hi' });
  });

  it('marks read with lastReadSeq', async () => {
    vi.mocked(messengerHttp.post).mockResolvedValue({ data: undefined } as never);
    await messengerSessionApi.read('s1', 7);
    expect(messengerHttp.post).toHaveBeenCalledWith('/chat-sessions/s1/read', { lastReadSeq: 7 });
  });

  it('closes a session', async () => {
    vi.mocked(messengerHttp.post).mockResolvedValue({ data: { id: 's1', status: 'CLOSED' } } as never);
    await messengerSessionApi.close('s1');
    expect(messengerHttp.post).toHaveBeenCalledWith('/chat-sessions/s1/close');
  });
});
