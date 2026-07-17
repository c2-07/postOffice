import time
import asyncio


class TokenBucketLimiter:
    def __init__(self, max_tokens: int, refill_rate: int, interval: float):
        self.max_token = max_tokens
        self.refill_rate = refill_rate
        self.interval = interval

        self.tokens = max_tokens
        self.refill_at = time.time()
        self.lock = asyncio.Lock()

    async def allow_request(self, token=1) -> bool:
        """attempt to consume token"""

        async with self.lock:
            ...

        return False
