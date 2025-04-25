--[[
  Process jobs in one atomic operation:
  - Get jobs from waiting list
  - Move them to active list
  - Return job IDs

  Input:
    KEYS[1] 'waiting' list key
    KEYS[2] 'active' list key
    KEYS[3] 'paused' key

    ARGV[1] count - number of jobs to get

  Output:
    Array of job IDs, or empty array if no jobs
]]

local waitingKey = KEYS[1]
local activeKey = KEYS[2]
local pausedKey = KEYS[3]
local count = tonumber(ARGV[1])
local rcall = redis.call

-- Check if queue is paused
if rcall("EXISTS", pausedKey) == 1 then
  return {}
end

-- Get job IDs from waiting list
local jobIds = rcall("LRANGE", waitingKey, 0, count - 1)

if #jobIds > 0 then
  -- Move jobs to active list in bulk
  for i = 1, #jobIds do
    -- Remove from waiting and add to active
    rcall("LREM", waitingKey, 1, jobIds[i])
    rcall("LPUSH", activeKey, jobIds[i])
  end
end

return jobIds