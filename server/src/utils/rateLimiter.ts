interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class UserRateLimiter {
  private limits = new Map<string, RateLimitEntry>();

  constructor(private maxRequests: number, private windowMs: number) { }

  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(userId);

    if (!entry || now > entry.resetAt) {
      this.limits.set(userId, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(userId: string): number {
    const entry = this.limits.get(userId);
    if (!entry || Date.now() > entry.resetAt) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(userId: string): number {
    const entry = this.limits.get(userId);
    if (!entry || Date.now() > entry.resetAt) {
      return 0;
    }
    return Math.ceil((entry.resetAt - Date.now()) / 1000);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(userId);
      }
    }
  }

  reset(userId?: string): void {
    if (userId) {
      this.limits.delete(userId);
    } else {
      this.limits.clear();
    }
  }
}
