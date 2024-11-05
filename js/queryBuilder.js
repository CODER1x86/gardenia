// queryBuilder.js

const buildDynamicQuery = (baseQuery, filters) => {
  let query = baseQuery;
  const params = [];

  Object.keys(filters).forEach((key) => {
    if (filters[key]) {
      switch (key) {
        case 'year':
          query += " AND strftime('%Y', date_column) = ?";
          params.push(filters.year);
          break;
        case 'month':
          query += " AND strftime('%m', date_column) = ?";
          params.push(filters.month);
          break;
        case 'category':
          query += " AND category = ?";
          params.push(filters.category);
          break;
        case 'unitNumber':
          query += " AND unit_id = ?";
          params.push(filters.unitNumber);
          break;
        case 'floor':
          query += " AND floor = ?";
          params.push(filters.floor);
          break;
        // Add other cases as needed
      }
    }
  });

  return { query, params };
};

module.exports = buildDynamicQuery;
