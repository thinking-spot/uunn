-- Fix Alliances Table to track initiator
ALTER TABLE "UnionAlliances"
ADD COLUMN "initiated_by_union_id" UUID REFERENCES "Unions"("id");
