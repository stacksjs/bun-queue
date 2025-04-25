--[[
  Rate limiter implementation

  Input:
    KEYS[1] 'limit' key prefix

    ARGV[1] identifier (e.g. queue name)
    ARGV[2] max - maximum number of jobs in window
    ARGV[3] duration - window duration in milliseconds
    ARGV[4] current timestamp

  Output:
    1 if rate limit exceeded, 0 if not
    remaining tokens
    time to reset in ms
]]

local rateLimitKey = KEYS[1] .. ":" .. ARGV[1]
local max = tonumber(ARGV[2])
local duration = tonumber(ARGV[3])
local now = tonumber(ARGV[4])
local rcall = redis.call

-- Clean up old tokens
rcall("ZREMRANGEBYSCORE", rateLimitKey, 0, now - duration)

-- Count tokens in current window
local tokenCount = rcall("ZCARD", rateLimitKey)

-- Check if limit exceeded
local limited = 0
if tokenCount >= max then
  limited = 1
end

-- Get time to reset (when the oldest token expires)
local timeToReset = 0
if tokenCount > 0 then
  local oldestToken = rcall("ZRANGE", rateLimitKey, 0, 0, "WITHSCORES")[2]
  timeToReset = math.max(0, (tonumber(oldestToken) + duration) - now)
end

-- If not limited, add new token
if limited == 0 then
  rcall("ZADD", rateLimitKey, now, now .. ":" .. math.random())
  -- Set expiry on the key
  rcall("EXPIRE", rateLimitKey, math.ceil(duration / 1000))
  tokenCount = tokenCount + 1
end

local remaining = math.max(0, max - tokenCount)

return {limited, remaining, timeToReset}