-- PostgreSQL partial unique index: any number of other roles is allowed, but
-- at most one row may have the SUPER_ADMIN role.
CREATE UNIQUE INDEX "User_single_super_admin_key"
ON "User" ("role")
WHERE "role" = 'SUPER_ADMIN';
