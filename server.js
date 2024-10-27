fastify.get("/api/revenue-report", async (request, reply) => {
  const { filter, year, month, unit, floor } = request.query;
  let query = "SELECT * FROM payments WHERE year = ?";
  let queryParams = [year];

  if (filter === "month") {
    query += " AND month = ?";
    queryParams.push(month);
  } else if (filter === "unit") {
    query += " AND unit_id = ?";
    queryParams.push(unit);
  } else if (filter === "floor") {
    query = `
      SELECT p.*, u.unit_number, u.floor, o.owner_name, t.tenant_name 
      FROM payments p 
      JOIN units u ON p.unit_id = u.unit_id 
      JOIN owners o ON u.owner_id = o.owner_id 
      JOIN tenants t ON u.tenant_id = t.tenant_id 
      WHERE u.floor = ? AND p.year = ?
    `;
    queryParams = [floor, year];
  }

  try {
    const result = await db.all(query, queryParams);
    reply.send(result);
  } catch (error) {
    console.error("Error fetching revenue report:", error);
    reply.status(500).send({ error: errorMessage });
  }
});
fastify.get("/api/expense-report", async (request, reply) => {
  const { filter, year, month, category } = request.query;
  let query = "SELECT * FROM expenses WHERE strftime('%Y', expense_date) = ?";
  let queryParams = [year];

  if (filter === "month") {
    query += " AND strftime('%m', expense_date) = ?";
    queryParams.push(month);
  } else if (filter === "category") {
    query += " AND category = ?";
    queryParams.push(category);
  }

  try {
    const result = await db.all(query, queryParams);
    reply.send(result);
  } catch (error) {
    console.error("Error fetching expense report:", error);
    reply.status(500).send({ error: errorMessage });
  }
});
fastify.get("/api/budget-details", async (request, reply) => {
  const { year, month } = request.query;
  let revenueQuery = "SELECT SUM(amount) AS totalRevenue FROM payments WHERE year = ?";
  let expensesQuery = "SELECT SUM(price) AS totalExpenses FROM expenses WHERE strftime('%Y', expense_date) = ?";
  let queryParams = [year];

  if (month) {
    revenueQuery += " AND month = ?";
    expensesQuery += " AND strftime('%m', expense_date) = ?";
    queryParams.push(month);
  }

  try {
    const revenueResult = await db.get(revenueQuery, queryParams);
    const expensesResult = await db.get(expensesQuery, queryParams);

    const balanceResult = await db.get("SELECT starting_balance FROM balance WHERE year_id = (SELECT year_id FROM years WHERE year = ?)", [year]);

    const availableBalance = balanceResult.starting_balance + revenueResult.totalRevenue - expensesResult.totalExpenses;

    reply.send({
      totalRevenue: revenueResult.totalRevenue,
      totalExpenses: expensesResult.totalExpenses,
      availableBalance: availableBalance
    });
  } catch (error) {
    console.error("Error fetching budget details:", error);
    reply.status(500).send({ error: errorMessage });
  }
});
