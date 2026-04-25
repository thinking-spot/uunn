-- Migration 0010: Security hardening (round 2)
-- Adds defensive constraints exposed by the security audit.
--
-- 1) Constrain Memberships.role to a known set so a buggy insert can't
--    silently grant or strip privileges by writing an unexpected string
--    (e.g. 'Admin' vs 'admin' confusion, or attacker-controlled role text).
-- 2) Constrain VoteResponses.choice to the values the app actually accepts.
-- 3) Constrain UnionJoinRequests.status and UnionAlliances.status similarly.
-- 4) Constrain Votes.status and Votes.vote_type.
--
-- Safe to re-run: each constraint uses a unique name and IF NOT EXISTS guard
-- via DO block.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'memberships_role_check'
    ) THEN
        ALTER TABLE "Memberships"
            ADD CONSTRAINT memberships_role_check
            CHECK (role IN ('admin', 'member'));
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vote_responses_choice_check'
    ) THEN
        ALTER TABLE "VoteResponses"
            ADD CONSTRAINT vote_responses_choice_check
            CHECK (choice IN ('yes', 'no', 'abstain'));
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'join_requests_status_check'
    ) THEN
        ALTER TABLE "UnionJoinRequests"
            ADD CONSTRAINT join_requests_status_check
            CHECK (status IN ('pending', 'accepted', 'rejected'));
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'union_alliances_status_check'
    ) THEN
        ALTER TABLE "UnionAlliances"
            ADD CONSTRAINT union_alliances_status_check
            CHECK (status IN ('pending', 'active'));
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'votes_status_check'
    ) THEN
        ALTER TABLE "Votes"
            ADD CONSTRAINT votes_status_check
            CHECK (status IN ('open', 'closed'));
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'votes_vote_type_check'
    ) THEN
        ALTER TABLE "Votes"
            ADD CONSTRAINT votes_vote_type_check
            CHECK (vote_type IN ('yes_no', 'multiple_choice'));
    END IF;
END$$;
