'use client';

import { createClient } from '@/lib/supabase/client';

export interface WorkflowLog {
  id?: string;
  workflowName: string;
  status: 'success' | 'error' | 'info' | 'warning' | 'running';
  agentId: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

function isSchemaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string };
  if (err.code && typeof err.code === 'string') {
    const errorClass = err.code.substring(0, 2);
    if (errorClass === '42' || errorClass === '08') return true;
    if (errorClass === '23') return false;
  }
  if (err.message) {
    const schemaErrorPatterns = [
      /relation.*does not exist/i,
      /column.*does not exist/i,
      /function.*does not exist/i,
      /syntax error/i,
    ];
    return schemaErrorPatterns.some((p) => p.test(err.message!));
  }
  return false;
}

export const workflowLogService = {
  async insert(log: WorkflowLog): Promise<void> {
    const supabase = createClient();
    try {
      const { error } = await supabase.from('workflow_logs').insert({
        workflow_name: log.workflowName,
        status: log.status,
        agent_id: log.agentId,
        user_email: log.userEmail ?? null,
        metadata: log.metadata ?? {},
      });
      if (error) {
        if (isSchemaError(error)) throw error;
        console.warn('workflow_logs insert error:', error.message);
      }
    } catch (err) {
      console.warn('workflowLogService.insert failed:', err);
    }
  },

  async fetchRecent(limit = 20): Promise<WorkflowLog[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('workflow_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (isSchemaError(error)) throw error;
        console.warn('workflow_logs fetch error:', error.message);
        return [];
      }

      return (data ?? []).map((row) => ({
        id: row.id,
        workflowName: row.workflow_name,
        status: row.status,
        agentId: row.agent_id,
        userEmail: row.user_email,
        metadata: row.metadata,
        createdAt: row.created_at,
      }));
    } catch (err) {
      console.warn('workflowLogService.fetchRecent failed:', err);
      return [];
    }
  },

  async fetchStats(): Promise<{
      totalWorkflows: number;
      successCount: number;
      errorCount: number;
      uniqueAgents: number;
      recentLogs: WorkflowLog[];
    }> {
      const supabase = createClient();
      try {
        // Run both queries in parallel — count (no data transfer) + recent rows for stats
        const [countResult, dataResult] = await Promise.all([
          supabase
            .from('workflow_logs')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('workflow_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100),
        ]);

        if (countResult.error) {
          if (isSchemaError(countResult.error)) throw countResult.error;
          console.warn('workflow_logs count error:', countResult.error.message);
        }
        if (dataResult.error) {
          if (isSchemaError(dataResult.error)) throw dataResult.error;
          console.warn('workflow_logs stats error:', dataResult.error.message);
          return { totalWorkflows: 0, successCount: 0, errorCount: 0, uniqueAgents: 0, recentLogs: [] };
        }

        const rows = dataResult.data ?? [];
        const logs = rows.map((row) => ({
          id: row.id,
          workflowName: row.workflow_name,
          status: row.status,
          agentId: row.agent_id,
          userEmail: row.user_email,
          metadata: row.metadata,
          createdAt: row.created_at,
        }));

        const uniqueAgents = new Set(rows.map((r) => r.agent_id)).size;
        const successCount = rows.filter((r) => r.status === 'success').length;
        const errorCount = rows.filter((r) => r.status === 'error').length;
  
        return {
          totalWorkflows: countResult.count ?? rows.length, // real total, fallback to rows.length
          successCount,
          errorCount,
          uniqueAgents,
          recentLogs: logs.slice(0, 6),
        };
      } catch (err) {
        console.warn('workflowLogService.fetchStats failed:', err);
        return { totalWorkflows: 0, successCount: 0, errorCount: 0, uniqueAgents: 0, recentLogs: [] };
      }
    },

  subscribeToNew(callback: (log: WorkflowLog) => void) {
    const supabase = createClient();
    const channel = supabase
      .channel('workflow_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'workflow_logs' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          callback({
            id: row.id as string,
            workflowName: row.workflow_name as string,
            status: row.status as WorkflowLog['status'],
            agentId: row.agent_id as string,
            userEmail: row.user_email as string | undefined,
            metadata: row.metadata as Record<string, unknown>,
            createdAt: row.created_at as string,
          });
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};
