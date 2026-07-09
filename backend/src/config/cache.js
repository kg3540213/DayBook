const redis = require("./redis");

const ENTRY_TTL     = 5  * 60; // 5 min  — entry list pages
const ANALYTICS_TTL = 10 * 60; // 10 min — aggregation results


const get = async (key) => {
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    // Cache errors must never crash the request — fall through to DB
    console.error("[Cache] GET error:", err.message);
    return null;
  }
};


const set = async (key, value, ttlSeconds = ENTRY_TTL) => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error("[Cache] SET error:", err.message);
  }
};

// ── del ───────────────────────────────────────────────────────────
const del = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    console.error("[Cache] DEL error:", err.message);
  }
};


const invalidateUser = async (userId) => {
  const pattern = `cache:user:${userId}:*`;
  try {
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(
        cursor, "MATCH", pattern, "COUNT", 100
      );
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== "0");
  } catch (err) {
    console.error("[Cache] invalidateUser error:", err.message);
  }
};


const keys = {
  entries:  (userId, page, limit)  => `cache:user:${userId}:entries:${page}:${limit}`,
  mood:     (userId)               => `cache:user:${userId}:analytics:mood`,
  weekly:   (userId, weeks)        => `cache:user:${userId}:analytics:weekly:${weeks}`,
  monthly:  (userId, months)       => `cache:user:${userId}:analytics:monthly:${months}`,
  streak:   (userId)               => `cache:user:${userId}:analytics:streak`,
};

module.exports = { get, set, del, invalidateUser, keys, ENTRY_TTL, ANALYTICS_TTL };