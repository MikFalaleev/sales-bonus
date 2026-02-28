/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */

function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;

  const discountDecimal = discount / 100;
  const total = sale_price * quantity;
  const revenue = total * (1 - discountDecimal);

  return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller; // тоже что и 'const profit = saller.profit'
  if (index === 0) return profit * 0.15;
  if (index === 1 || index === 2) return profit * 0.1;
  if (index === total - 1) return 0;
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

  const productsBySku = new Map();
  for (const product of data.products) {
    productsBySku.set(product.sku, product);
  }

  // @TODO: Расчет выручки и прибыли для каждого продавца

  for (const record of data.purchase_records) {
    const stats = sellerStats.get(record.seller_id);
    if (!stats) continue;

    stats.sales_count += 1;
    stats.revenue += record.total_amount;

    for (const item of record.items) {
      const product = productsBySku.get(item.sku);
      if (!product) continue;

      const revenue = calculateRevenue(item, product);
      const cost = product.purchase_price * item.quantity;

      stats.profit += revenue - cost;

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

  for (const seller of sortedSellers) {
    delete seller.products_sold;
  }

  const result = sortedSellers.map((seller) => ({
    seller_id: seller.seller_id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products_count: seller.top_products.length,
    bonus: +seller.bonus.toFixed(2),
    top_products: seller.top_products,
  }));

  return result;
}
