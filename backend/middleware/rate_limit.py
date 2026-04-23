import time
from collections import defaultdict
from fastapi import Request, HTTPException

_requests: dict[str, list[float]] = defaultdict(list)
WINDOW = 60
MAX_REQUESTS = 30


async def rate_limit(request: Request, call_next):
    ip = request.client.host
    now = time.time()
    _requests[ip] = [t for t in _requests[ip] if now - t < WINDOW]
    if len(_requests[ip]) >= MAX_REQUESTS:
        raise HTTPException(status_code=429, detail=f"Too many requests — limit {MAX_REQUESTS}/min")
    _requests[ip].append(now)
    return await call_next(request)
