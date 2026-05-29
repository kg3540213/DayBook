const Redis = require("ioredis")

const redis = new Redis(process.env.REDIS_URL, {
  tls: process.env.REDIS_URL?.startsWith("rediss://")
    ? { rejectUnauthorized: false }
    : undefined,

  // Retry up to 3 times with exponential backoff
  retryStrategy: (times) => {
    if (times > 3) {
      console.error("Redis: max reconnect attempts reached.");
      return null;
    }
    return Math.min(times * 200, 2000); // 200ms → 400ms → 600ms
  },
});

redis.on("connect", () => console.log("Redis connected successfully!"));
redis.on("error",   (err) => console.error("Redis error:", err.message));

module.exports = redis;