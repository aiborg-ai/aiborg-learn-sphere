/**
 * useChatbotAnalytics Hook
 * Fetches and manages chatbot usage analytics data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyStat {
  date: string;
  total_conversations: number;
  total_messages: number;
  total_api_calls: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_cost_usd: number;
  avg_cost_per_message_usd: number;
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  p99_response_time_ms: number;
  total_errors: number;
  total_fallbacks: number;
  error_rate: number;
  primary_messages: number;
  secondary_messages: number;
  professional_messages: number;
  business_messages: number;
}

export interface CostSummary {
  period: string;
  total_cost_usd: number;
  total_messages: number;
  total_tokens: number;
  avg_cost_per_message: number;
  error_rate: number;
}

export interface RecentMessage {
  id: string;
  created_at: string;
  audience: string;
  role: string;
  content: string;
  total_tokens: number;
  cost_usd: number;
  response_time_ms: number;
  is_error: boolean;
  is_fallback: boolean;
}

export interface CostAlert {
  id: string;
  alert_type: string;
  threshold_usd: number;
  current_amount_usd: number;
  is_triggered: boolean;
  triggered_at: string | null;
}

/**
 * Fetch daily statistics for a date range
 */
export function useDailyStats(days: number = 30) {
  return useQuery({
    queryKey: ['chatbot-daily-stats', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('chatbot_daily_stats')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data as DailyStat[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch cost summary for a period
 */
export function useCostSummary(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['chatbot-cost-summary', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      const { data, error } = await supabase.rpc('get_chatbot_cost_summary', {
        p_start_date: start.toISOString().split('T')[0],
        p_end_date: end.toISOString().split('T')[0],
      });

      if (error) throw error;
      return data?.[0] as CostSummary;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch today's cost and usage
 */
export function useTodayStats() {
  return useQuery({
    queryKey: ['chatbot-today-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('chatbot_daily_stats')
        .select('*')
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found
      return data as DailyStat | null;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60, // Auto-refresh every minute
  });
}

/**
 * Fetch real-time cost for today (from messages table)
 */
export function useRealTimeCost() {
  return useQuery({
    queryKey: ['chatbot-realtime-cost'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('cost_usd, total_tokens, response_time_ms')
        .gte('created_at', `${today}T00:00:00`)
        .eq('role', 'assistant');

      if (error) throw error;

      const totalCost = data?.reduce((sum, msg) => sum + (msg.cost_usd || 0), 0) || 0;
      const totalTokens = data?.reduce((sum, msg) => sum + (msg.total_tokens || 0), 0) || 0;
      const avgResponseTime =
        data && data.length > 0
          ? data.reduce((sum, msg) => sum + (msg.response_time_ms || 0), 0) / data.length
          : 0;

      return {
        cost_today: totalCost,
        messages_today: data?.length || 0,
        tokens_today: totalTokens,
        avg_response_time: Math.round(avgResponseTime),
      };
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
}

/**
 * Fetch recent messages
 */
export function useRecentMessages(limit: number = 50) {
  return useQuery({
    queryKey: ['chatbot-recent-messages', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as RecentMessage[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch cost alerts
 */
export function useCostAlerts() {
  return useQuery({
    queryKey: ['chatbot-cost-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_cost_alerts')
        .select('*')
        .order('alert_type');

      if (error) throw error;
      return data as CostAlert[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch audience breakdown
 */
export function useAudienceBreakdown(days: number = 30) {
  return useQuery({
    queryKey: ['chatbot-audience-breakdown', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('audience, total_tokens, cost_usd, response_time_ms')
        .gte('created_at', startDate.toISOString())
        .eq('role', 'assistant');

      if (error) throw error;

      // Aggregate by audience
      const breakdown = data?.reduce(
        (acc, msg) => {
          const aud = msg.audience || 'default';
          if (!acc[aud]) {
            acc[aud] = {
              audience: aud,
              total_messages: 0,
              total_tokens: 0,
              total_cost: 0,
              avg_response_time: 0,
            };
          }
          acc[aud].total_messages += 1;
          acc[aud].total_tokens += msg.total_tokens || 0;
          acc[aud].total_cost += msg.cost_usd || 0;
          acc[aud].avg_response_time += msg.response_time_ms || 0;
          return acc;
        },
        {} as Record<string, Record<string, number | string>>
      );

      // Calculate averages
      Object.values(breakdown || {}).forEach((aud: Record<string, number>) => {
        aud.avg_response_time = Math.round(aud.avg_response_time / aud.total_messages);
      });

      return Object.values(breakdown || {});
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch error statistics
 */
export function useErrorStats(days: number = 7) {
  return useQuery({
    queryKey: ['chatbot-error-stats', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('created_at, is_error, is_fallback')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Group by day
      const dailyErrors = data?.reduce(
        (acc, msg) => {
          const day = msg.created_at.split('T')[0];
          if (!acc[day]) {
            acc[day] = { date: day, errors: 0, fallbacks: 0, total: 0 };
          }
          acc[day].total += 1;
          if (msg.is_error) acc[day].errors += 1;
          if (msg.is_fallback) acc[day].fallbacks += 1;
          return acc;
        },
        {} as Record<string, Record<string, number | string>>
      );

      return Object.values(dailyErrors || {}).sort((a: { date: string }, b: { date: string }) =>
        b.date.localeCompare(a.date)
      );
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Calculate projected monthly cost based on current usage
 */
export function useProjectedMonthlyCost() {
  const { data: todayStats } = useTodayStats();
  const { data: realtimeCost } = useRealTimeCost();

  const currentDayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const avgDailyCost = todayStats?.total_cost_usd || realtimeCost?.cost_today || 0;
  const projectedMonthlyCost = (avgDailyCost / currentDayOfMonth) * daysInMonth;

  return {
    projected: projectedMonthlyCost,
    daily_average: avgDailyCost,
    current_day: currentDayOfMonth,
    days_in_month: daysInMonth,
  };
}
