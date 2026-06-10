import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PrismaClient } from "@prisma/client";

export interface GetDashboardMetricsQuery extends IQuery {}

export interface DashboardMetricsResult {
  totalRevenue: number;
  revenueTrend: string;
  activeOrders: number;
  ordersTrend: string;
  newCustomers: number;
  customersTrend: string;
  conversionRate: number;
  conversionTrend: string;
  monthlyRevenue: number[];
  ordersToday: number;
  avgOrderValue: number;
  itemsShipped: number;
  bestSeller: {
    productId: string;
    title: string;
    units: number;
    revenue: number;
    image?: string;
  } | null;
}

export class GetDashboardMetricsHandler implements IQueryHandler<GetDashboardMetricsQuery, DashboardMetricsResult> {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(_query: GetDashboardMetricsQuery): Promise<DashboardMetricsResult> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. Total Revenue and Monthly Revenue and Trend
    const paidOrders = await this.prisma.order.findMany({
      where: {
        status: {
          in: ["paid", "fulfilled", "partially_returned"]
        }
      },
      select: {
        totals: true,
        createdAt: true
      }
    });

    let totalRevenue = 0;
    let revenuePeriodA = 0;
    let revenuePeriodB = 0;
    const currentYear = now.getFullYear();
    const monthlyRevenue = Array(12).fill(0);

    paidOrders.forEach((o) => {
      if (o.totals && typeof o.totals === "object" && !Array.isArray(o.totals)) {
        const totalsObj = o.totals as { total?: number | string; totalAmount?: number | string };
        const totalVal = Number(totalsObj.total || totalsObj.totalAmount || 0);
        totalRevenue += totalVal;

        const orderDate = new Date(o.createdAt);
        if (orderDate.getFullYear() === currentYear) {
          const monthIndex = orderDate.getMonth();
          monthlyRevenue[monthIndex] = Number((monthlyRevenue[monthIndex] + totalVal).toFixed(2));
        }

        // Rolling periods for trend calculation
        if (orderDate >= thirtyDaysAgo) {
          revenuePeriodA += totalVal;
        } else if (orderDate >= sixtyDaysAgo) {
          revenuePeriodB += totalVal;
        }
      }
    });

    // Compute Revenue Trend
    let revenueTrendVal = 0;
    if (revenuePeriodB > 0) {
      revenueTrendVal = Number((((revenuePeriodA - revenuePeriodB) / revenuePeriodB) * 100).toFixed(1));
    } else if (revenuePeriodA > 0) {
      revenueTrendVal = 100.0;
    }
    const revenueTrendSign = revenueTrendVal >= 0 ? "+" : "";
    const revenueTrend = `${revenueTrendSign}${revenueTrendVal}% from last month`;

    // 2. Active Orders and Trend
    const activeOrdersCount = await this.prisma.order.count({
      where: {
        status: {
          in: ["created", "paid"]
        }
      }
    });

    const ordersPeriodA = await this.prisma.order.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    });
    const ordersPeriodB = await this.prisma.order.count({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
      }
    });

    let ordersTrendVal = 0;
    if (ordersPeriodB > 0) {
      ordersTrendVal = Number((((ordersPeriodA - ordersPeriodB) / ordersPeriodB) * 100).toFixed(1));
    } else if (ordersPeriodA > 0) {
      ordersTrendVal = 100.0;
    }
    const ordersTrendSign = ordersTrendVal >= 0 ? "+" : "";
    const ordersTrend = `${ordersTrendSign}${ordersTrendVal}% from last month`;

    // 3. New Customers and Trend
    const customerCount = await this.prisma.user.count({
      where: {
        role: "CUSTOMER",
        isGuest: false
      }
    });

    const customersPeriodA = await this.prisma.user.count({
      where: {
        role: "CUSTOMER",
        isGuest: false,
        createdAt: { gte: thirtyDaysAgo }
      }
    });
    const customersPeriodB = await this.prisma.user.count({
      where: {
        role: "CUSTOMER",
        isGuest: false,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
      }
    });

    let customersTrendVal = 0;
    if (customersPeriodB > 0) {
      customersTrendVal = Number((((customersPeriodA - customersPeriodB) / customersPeriodB) * 100).toFixed(1));
    } else if (customersPeriodA > 0) {
      customersTrendVal = 100.0;
    }
    const customersTrendSign = customersTrendVal >= 0 ? "+" : "";
    const customersTrend = `${customersTrendSign}${customersTrendVal}% from last month`;

    // 4. Conversion Rate and Trend
    const totalOrders = await this.prisma.order.count();
    const totalCarts = await this.prisma.shoppingCart.count();
    
    let conversionRate = 3.24;
    if (totalCarts > 0) {
      conversionRate = Number(((totalOrders / totalCarts) * 100).toFixed(2));
    }

    const cartsPeriodA = await this.prisma.shoppingCart.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });
    const cartsPeriodB = await this.prisma.shoppingCart.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    });

    const convRateA = cartsPeriodA > 0 ? (ordersPeriodA / cartsPeriodA) * 100 : 0;
    const convRateB = cartsPeriodB > 0 ? (ordersPeriodB / cartsPeriodB) * 100 : 0;

    let conversionTrendVal = 0;
    if (convRateB > 0) {
      conversionTrendVal = Number((((convRateA - convRateB) / convRateB) * 100).toFixed(1));
    } else if (convRateA > 0) {
      conversionTrendVal = 100.0;
    }
    const conversionTrendSign = conversionTrendVal >= 0 ? "+" : "";
    const conversionTrend = `${conversionTrendSign}${conversionTrendVal}% from last month`;

    // 5. Today's Pulse Metrics
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const ordersToday = await this.prisma.order.count({
      where: {
        createdAt: { gte: startOfToday }
      }
    });

    const avgOrderValue = paidOrders.length > 0
      ? Number((totalRevenue / paidOrders.length).toFixed(2))
      : 0;

    const shippedItemsSum = await this.prisma.orderItem.aggregate({
      where: {
        order: {
          status: { in: ["shipped", "delivered", "fulfilled"] }
        }
      },
      _sum: {
        qty: true
      }
    });
    const itemsShipped = shippedItemsSum._sum.qty || 0;

    // 6. Best Seller Product Calculation
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          status: {
            in: ["paid", "fulfilled", "partially_returned"]
          }
        }
      }
    });

    const productSales: Record<string, {
      productId: string;
      title: string;
      units: number;
      revenue: number;
      image?: string;
    }> = {};

    orderItems.forEach((item) => {
      if (item.productSnapshot && typeof item.productSnapshot === "object") {
        const snapshot = item.productSnapshot as Record<string, any>;
        const productId = snapshot.productId || snapshot.id;
        const title = snapshot.title || snapshot.name || "Unknown Product";
        const price = Number(snapshot.price || snapshot.priceUsd || 0);
        const qty = item.qty || 0;
        
        let imageUrl: string | undefined;
        if (snapshot.images && Array.isArray(snapshot.images) && snapshot.images.length > 0) {
          imageUrl = snapshot.images[0];
        } else if (snapshot.coverImage) {
          imageUrl = snapshot.coverImage;
        }

        if (productId) {
          if (!productSales[productId]) {
            productSales[productId] = {
              productId,
              title,
              units: 0,
              revenue: 0,
              image: imageUrl
            };
          }
          productSales[productId].units += qty;
          productSales[productId].revenue += qty * price;
        }
      }
    });

    let bestSeller: {
      productId: string;
      title: string;
      units: number;
      revenue: number;
      image?: string;
    } | null = null;

    for (const p of Object.values(productSales)) {
      if (!bestSeller || p.units > bestSeller.units) {
        bestSeller = p;
      }
    }

    if (bestSeller) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bestSeller.productId);
        if (isUuid) {
          const dbProduct = await this.prisma.product.findUnique({
            where: { id: bestSeller.productId },
            select: {
              title: true,
              media: {
                where: { isCover: true },
                select: {
                  asset: {
                    select: {
                      storageKey: true
                    }
                  }
                },
                take: 1
              }
            }
          });

          if (dbProduct) {
            bestSeller.title = dbProduct.title;
            if (dbProduct.media && dbProduct.media.length > 0 && dbProduct.media[0].asset) {
              bestSeller.image = dbProduct.media[0].asset.storageKey;
            }
          }
        }
      } catch (err) {
        console.error("Error retrieving best seller details from DB:", err);
      }
    }

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      revenueTrend,
      activeOrders: activeOrdersCount,
      ordersTrend,
      newCustomers: customerCount,
      customersTrend,
      conversionRate,
      conversionTrend,
      monthlyRevenue,
      ordersToday,
      avgOrderValue,
      itemsShipped,
      bestSeller
    };
  }
}
