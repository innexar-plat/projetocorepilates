import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api';
import { UserRole, SubscriptionStatus, BookingStatus, LeadStatus } from '@prisma/client';

/**
 * GET /api/v1/admin/analytics
 * Returns aggregate platform statistics for the admin dashboard. Admin only.
 *
 * Data returned:
 *  - Users: total, active, new this month
 *  - Subscriptions: by status, MRR (monthly recurring revenue)
 *  - Bookings: total this month, cancellation rate
 *  - Leads: by status, conversion rate
 *  - Support: open tickets
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersThisMonth,
      subscriptionsByStatus,
      bookingsThisMonth,
      canceledBookingsThisMonth,
      leadsByStatus,
      openTickets,
      revenueThisMonth,
    ] = await Promise.all([
      db.user.count({ where: { deletedAt: null, role: UserRole.CLIENT } }),
      db.user.count({ where: { deletedAt: null, role: UserRole.CLIENT, createdAt: { gte: startOfMonth } } }),

      db.subscription.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      db.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.booking.count({ where: { createdAt: { gte: startOfMonth }, status: BookingStatus.CANCELED } }),

      db.lead.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      db.supportTicket.count({ where: { status: 'OPEN' } }),

      db.payment.aggregate({
        where: { createdAt: { gte: startOfMonth }, status: 'SUCCEEDED' },
        _sum: { amount: true },
      }),
    ]);

    // Calculate MRR from active subscriptions + their plans
    const activeSubscriptionsWithPlans = await db.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: { plan: { select: { price: true } } },
    });
    const mrr = activeSubscriptionsWithPlans.reduce(
      (sum, sub) => sum + (sub.plan?.price?.toNumber?.() ?? Number(sub.plan?.price ?? 0)),
      0,
    );

    const subsMap = Object.fromEntries(
      subscriptionsByStatus.map((s) => [s.status, s._count.status])
    );
    const leadsMap = Object.fromEntries(
      leadsByStatus.map((l) => [l.status, l._count.status])
    );

    const totalLeads = Object.values(leadsMap).reduce((a, b) => a + b, 0);
    const convertedLeads = leadsMap[LeadStatus.CONVERTED] ?? 0;

    return apiSuccess({
      data: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
        },
        subscriptions: {
          active: subsMap[SubscriptionStatus.ACTIVE] ?? 0,
          pastDue: subsMap[SubscriptionStatus.PAST_DUE] ?? 0,
          canceled: subsMap[SubscriptionStatus.CANCELED] ?? 0,
          trialing: subsMap[SubscriptionStatus.TRIALING] ?? 0,
          mrr: Number(mrr.toFixed(2)),
        },
        bookings: {
          totalThisMonth: bookingsThisMonth,
          canceledThisMonth: canceledBookingsThisMonth,
          cancellationRate: bookingsThisMonth > 0
            ? Number(((canceledBookingsThisMonth / bookingsThisMonth) * 100).toFixed(1))
            : 0,
        },
        leads: {
          total: totalLeads,
          converted: convertedLeads,
          conversionRate: totalLeads > 0
            ? Number(((convertedLeads / totalLeads) * 100).toFixed(1))
            : 0,
          byStatus: leadsMap,
        },
        support: {
          openTickets,
        },
        revenue: {
          thisMonth: Number((revenueThisMonth._sum.amount?.toNumber?.() ?? Number(revenueThisMonth._sum.amount ?? 0)).toFixed(2)),
        },
        generatedAt: now.toISOString(),
      },
    });
  } catch (err) {
    return apiError(err);
  }
}
