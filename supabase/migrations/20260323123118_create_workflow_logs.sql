-- Create workflow_logs table for real-time agent activity tracking
CREATE TABLE IF NOT EXISTS public.workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name TEXT NOT NULL,
    status TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    user_email TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_workflow_logs_created_at ON public.workflow_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_workflow_name ON public.workflow_logs(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_status ON public.workflow_logs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_agent_id ON public.workflow_logs(agent_id);

-- Enable Row Level Security
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (demo app — no auth required for reading)
DROP POLICY IF EXISTS "public_read_workflow_logs" ON public.workflow_logs;
CREATE POLICY "public_read_workflow_logs"
ON public.workflow_logs
FOR SELECT
TO public
USING (true);

-- Allow public insert (demo app — agents log without auth)
DROP POLICY IF EXISTS "public_insert_workflow_logs" ON public.workflow_logs;
CREATE POLICY "public_insert_workflow_logs"
ON public.workflow_logs
FOR INSERT
TO public
WITH CHECK (true);

-- Seed initial demo data so dashboard shows real data immediately
DO $$
BEGIN
    INSERT INTO public.workflow_logs (id, workflow_name, status, agent_id, user_email, metadata, created_at) VALUES
        (gen_random_uuid(), 'Employee Onboarding', 'success', 'Orchestrator', 'arjun.mehta@company.com', jsonb_build_object('employee', 'Arjun Mehta', 'steps_completed', 7, 'steps_total', 8, 'incident', 'INC-8821'), NOW() - INTERVAL '2 minutes'),
        (gen_random_uuid(), 'Employee Onboarding', 'error', 'Execution', 'arjun.mehta@company.com', jsonb_build_object('action', 'JIRA provisioning failed', 'error_code', 'HTTP 403', 'ticket', 'INC-8821'), NOW() - INTERVAL '2 minutes'),
        (gen_random_uuid(), 'SLA Breach Prevention', 'success', 'Decision', 'sarah.chen@company.com', jsonb_build_object('workflow_id', 'FIN-2026-0320-PRO', 'amount', 127400, 'breach_duration_min', 13, 'penalty_avoided', 4200), NOW() - INTERVAL '18 minutes'),
        (gen_random_uuid(), 'SLA Breach Prevention', 'success', 'Audit', 'sarah.chen@company.com', jsonb_build_object('policy', 'FIN-POL-07', 'signature', 'sha256:a1b2c3', 'hmac_signed', true), NOW() - INTERVAL '18 minutes'),
        (gen_random_uuid(), 'Meeting Actions', 'success', 'Retrieval', 'riya.kapoor@company.com', jsonb_build_object('meeting_id', 'MTG-2026-0322-Q3', 'duration_min', 47, 'tokens', 8241, 'action_items', 6), NOW() - INTERVAL '1 hour'),
        (gen_random_uuid(), 'Meeting Actions', 'info', 'Compliance', 'lena.fischer@company.com', jsonb_build_object('item', 'Coordinate vendor demo', 'confidence', 34, 'flagged', true, 'assignee', 'Lena Fischer'), NOW() - INTERVAL '1 hour'),
        (gen_random_uuid(), 'Employee Onboarding', 'success', 'Execution', 'priya.sharma@company.com', jsonb_build_object('employee', 'Priya Sharma', 'steps_completed', 8, 'steps_total', 8), NOW() - INTERVAL '3 hours'),
        (gen_random_uuid(), 'SLA Breach Prevention', 'success', 'Compliance', 'james.okonkwo@company.com', jsonb_build_object('workflow_id', 'FIN-2026-0319-PRO', 'amount', 85000, 'breach_duration_min', 8, 'penalty_avoided', 2100), NOW() - INTERVAL '5 hours'),
        (gen_random_uuid(), 'Meeting Actions', 'success', 'Orchestrator', 'marcus.obi@company.com', jsonb_build_object('meeting_id', 'MTG-2026-0321-SPRINT', 'action_items', 4, 'linear_tasks', 4), NOW() - INTERVAL '6 hours'),
        (gen_random_uuid(), 'Employee Onboarding', 'success', 'Decision', 'tom.nakamura@company.com', jsonb_build_object('employee', 'Tom Nakamura', 'buddy', 'Dev Patel', 'match_score', 91), NOW() - INTERVAL '8 hours')
    ON CONFLICT (id) DO NOTHING;
END $$;
