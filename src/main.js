/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */

function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { sale_price, quantity } = purchase;

  const discount = 1 - purchase.discount / 100;
  return sale_price * quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;

  if (total === 0 || profit <= 0) return 0;
  if (total > 1 && index === total - 1) return 0;

  if (index === 0) return profit * 0.15;
  if (index === 1 || index === 2) return profit * 0.1;

  return profit * 0.05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных

  if (
    !data ||
    !Array.isArray(data.sellers) ||
    data.sellers.length === 0 ||
    !Array.isArray(data.products) ||
    data.products.length === 0 ||
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций
  if (
    !options ||
    typeof options.calculateRevenue !== "function" ||
    typeof options.calculateBonus !== "function"
  ) {
    throw new Error(
      "Invalid options format: expected calculateRevenue/calculateBonus functions"
    );
  }

  const { calculateRevenue, calculateBonus } = options;

  // @TODO: Подготовка промежуточных данных для сбора статистики

  const sellerStats = new Map();
  for (const seller of data.sellers) {
    sellerStats.set(seller.id, {
      seller_id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      sales_count: 0,
      revenue: 0,
      profit: 0,
      bonus: 0,
      products_sold: {},
    });
  }

  // @TODO: Индексация продавцов и товаров для быстрого доступа

  const sellerStatsArray = Array.from(sellerStats.values());
  const sellerIndex = Object.fromEntries(
    sellerStatsArray.map((stats) => [stats.seller_id, stats])
  );
  const productIndex = Object.fromEntries(
    data.products.map((product) => [product.sku, product])
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца
  for (const record of data.purchase_records) {
    const stats = sellerStats.get(record.seller_id);
    if (!stats) continue;
    stats.sales_count += 1;

    for (const item of record.items) {
      const product = productIndex[item.sku];
      if (!product) continue;

      const itemRevenue = calculateRevenue(item, product);

      const itemCost = product.purchase_price * item.quantity;

      stats.revenue += itemRevenue;
      stats.profit += itemRevenue - itemCost;

      if (stats.products_sold[item.sku] === undefined) {
        stats.products_sold[item.sku] = 0;
      }
      stats.products_sold[item.sku] += item.quantity;
    }
  }

  // @TODO: Сортировка продавцов по прибыли

  const sortedSellers = Array.from(sellerStats.values()).sort(
    (a, b) => b.profit - a.profit
  );

  // @TODO: Назначение премий на основе ранжирования

  for (let i = 0; i < sortedSellers.length; i++) {
    const seller = sortedSellers[i];

    // 1) Бонус
    seller.bonus = calculateBonus(i, sortedSellers.length, seller);

    // 2) Топ-10 товаров (по количеству)
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }

  // @TODO: Подготовка итоговой коллекции с нужными полями

  const result = sortedSellers.map((seller) => ({
    seller_id: seller.seller_id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products
      .map((p) => `${p.sku} (${p.quantity})`)
      .join(", "),
    bonus: +seller.bonus.toFixed(2),
  }));

  return result;
}
