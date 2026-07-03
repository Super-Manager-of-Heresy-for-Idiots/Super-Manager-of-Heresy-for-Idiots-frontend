import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './axios';
import { friendsApi } from './friends.api';

vi.mock('./axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const ok = (data: unknown) => ({ data: { success: true, data } }) as never;

describe('friendsApi (URL/method/body contract)', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it('searches users with a username + limit', async () => {
    vi.mocked(api.get).mockResolvedValue(ok([]));
    await friendsApi.searchUsers('ali', 10);
    expect(api.get).toHaveBeenCalledWith('/users/search', { params: { username: 'ali', limit: 10 } });
  });

  it('sends a request with { userId }', async () => {
    vi.mocked(api.post).mockResolvedValue(ok({}));
    await friendsApi.sendRequest('u2');
    expect(api.post).toHaveBeenCalledWith('/friends/requests', { userId: 'u2' });
  });

  it('lists requests with a lower-cased direction', async () => {
    vi.mocked(api.get).mockResolvedValue(ok([]));
    await friendsApi.listRequests('INCOMING');
    expect(api.get).toHaveBeenCalledWith('/friends/requests', { params: { direction: 'incoming' } });
  });

  it('accepts / declines / cancels by relationship id', async () => {
    vi.mocked(api.post).mockResolvedValue(ok({}));
    vi.mocked(api.delete).mockResolvedValue(ok(undefined));
    await friendsApi.acceptRequest('r1');
    await friendsApi.declineRequest('r1');
    await friendsApi.cancelRequest('r1');
    expect(api.post).toHaveBeenCalledWith('/friends/requests/r1/accept');
    expect(api.post).toHaveBeenCalledWith('/friends/requests/r1/decline');
    expect(api.delete).toHaveBeenCalledWith('/friends/requests/r1');
  });

  it('removes / blocks / unblocks by user id', async () => {
    vi.mocked(api.post).mockResolvedValue(ok({}));
    vi.mocked(api.delete).mockResolvedValue(ok(undefined));
    await friendsApi.removeFriend('u2');
    await friendsApi.block('u2');
    await friendsApi.unblock('u2');
    expect(api.delete).toHaveBeenCalledWith('/friends/u2');
    expect(api.post).toHaveBeenCalledWith('/friends/u2/block');
    expect(api.delete).toHaveBeenCalledWith('/friends/u2/block');
  });
});
