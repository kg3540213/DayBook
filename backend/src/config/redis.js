const Redis = require("ioredis");

// ------------------------------------------------------------------
// Redis client — Redis Cloud setup
//
// In your .env set REDIS_URL to one of:
//
//   Without TLS (port 6379):
//   REDIS_URL=redis://:<password>@<host>:<port>
//
//   With TLS (port 6380, Redis Cloud default):
//   REDIS_URL=rediss://:<password>@<host>:<port>
//              ↑ double 's' = TLS
//
// Format: redis[s]://:<password>@<host>:<port>
//                    ↑ colon before password, no username needed
// ------------------------------------------------------------------

// ioredis automatically enables TLS when the URL scheme is "rediss://"
// rejectUnauthorized: false accepts Redis Cloud's managed certificate
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