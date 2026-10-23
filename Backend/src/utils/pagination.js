const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

/** Reads ?page=&limit= from the query string */
const parsePagination = (query = {}) => {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
};

const buildPage = (items, total, { page, limit }) => ({
  items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});

module.exports = { parsePagination, buildPage };
