# Deploy PUVerse to AWS from the AWS Console

> **Console-only path:** This guide uses the AWS Console for deployment. You do
> not need AWS CLI, ECR CLI, Docker, or terminal commands. CodeBuild runs the
> backend build inside AWS after you start it from the Console.

This is the complete production deployment runbook for this repository. It
deploys:

- `frontend` to AWS Amplify Hosting
- `backend` to Amazon ECR and AWS App Runner
- PostgreSQL to Amazon RDS
- production values to AWS Secrets Manager

The examples use `ap-south-1` (Mumbai). Use the same AWS Region for every
resource in this guide.

## Recommended profile for 200 users

Assuming 200 registered users with a smaller number active at the same time,
use this availability profile:

- Amplify Hosting for the frontend, with its managed HTTPS and CDN.
- App Runner with **minimum 2 instances**, **maximum 4 instances**, and health
  checks enabled. Place instances across Availability Zones through the VPC
  connector.
- RDS PostgreSQL with **Multi-AZ**, automated backups, deletion protection,
  and storage autoscaling.
- Two private subnets in different Availability Zones.
- Two NAT gateways, one per Availability Zone, if the API sends email through
  a public SMTP service. Amazon SES is preferred.
- Immutable ECR image tags and manual promotion of tested releases.
- CloudWatch alarms for failed deployments, unhealthy instances, API errors,
  latency, CPU, memory, database connections, and storage.

This removes the normal single-instance and single-AZ failure points. No AWS
design can promise literal zero downtime during every provider incident or
destructive schema change, so database migrations must remain backward
compatible while old and new API instances run together.

## Console-only order

Complete the steps in this order:

1. Select the AWS Region.
2. Create the VPC, private subnets, security groups, and NAT gateway.
3. Create the private RDS PostgreSQL database.
4. Create the Secrets Manager secrets.
5. Create the App Runner IAM roles.
6. Start the CodeBuild project to build and publish the backend image to ECR.
7. Create an App Runner VPC connector and service.
8. Run the one-time administrator bootstrap.
9. Deploy the frontend from the Git provider in Amplify.
10. Add domains, update CORS, and complete production checks.

For a no-terminal deployment, this repository must be available in GitHub,
GitLab, or Bitbucket. AWS CodeBuild checks out the repository and builds
`backend/Dockerfile` inside AWS, then publishes the image to ECR.

## Architecture and important repository facts

The request flow is:

```text
Browser -> Amplify HTTPS site -> App Runner API -> RDS PostgreSQL
                                      |
                                      -> SMTP provider
```

The backend image in `backend/Dockerfile`:

1. installs dependencies and builds NestJS;
2. exposes port `3001`;
3. runs `prisma migrate deploy`;
4. starts `node dist/src/main.js`.

The API routes are prefixed with `/api`, so use these URLs:

```text
Health:  https://API_DOMAIN/api/health
Swagger: https://API_DOMAIN/api/docs
API URL: https://API_DOMAIN/api
```

The image does **not** run `prisma db seed` automatically. The first-admin
bootstrap is an explicit step below.

## 1. Prerequisites

Install or prepare:

1. An AWS account with billing enabled.
2. Permission to create or manage RDS, VPC, ECR, App Runner, Amplify,
   Secrets Manager, IAM, CloudWatch, and Route 53 resources.
3. A GitHub, GitLab, or Bitbucket repository containing this project.
4. An SMTP provider. Amazon SES is recommended for production email.
5. A domain name if you want a branded frontend or API URL.

In the AWS Console, choose `ap-south-1` from the Region selector and confirm
the signed-in account name in the account menu. For a shared production
account, use an IAM Identity Center role or another organization-managed IAM
role. Never place AWS credentials in the repository or frontend variables.

## 2. Repository checks before deployment

Confirm that the connected Git repository contains these files. CodeBuild and
Amplify will read them directly from the selected branch:

The repository must contain these files for the API image and database
migrations:

```text
backend/Dockerfile
backend/package.json
backend/package-lock.json
backend/prisma.config.ts
backend/prisma/schema.prisma
backend/prisma/migrations/
backend/src/
amplify.yml
frontend/
```

Do not commit `.env`, database passwords, SMTP passwords, JWT secrets, or
real administrator passwords.

## 3. Create the VPC networking

You can use an existing production VPC. If creating a new one, create:

- one VPC, for example `10.0.0.0/16`;
- at least two private subnets in different Availability Zones;
- a DB subnet group containing those private subnets;
- an internet gateway and public subnets if a NAT gateway is required;
- one NAT gateway in each Availability Zone if the API must reach Gmail, SES
  SMTP, or another public SMTP service. A single NAT gateway is a failure
  point for the other Availability Zone.

The RDS database should remain private. App Runner reaches it through a VPC
connector. A VPC connector uses private subnets, and its security group is
the source security group for the database rule.

### 3.1 Create security groups

Create these security groups in the same VPC:

1. `puverse-rds`: for the RDS instance.
2. `puverse-apprunner-vpc`: for the App Runner VPC connector.

For `puverse-rds`, add this inbound rule:

```text
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: puverse-apprunner-vpc security group
```

Do not use `0.0.0.0/0`. Do not use your laptop IP as the permanent database
rule. The App Runner service itself remains publicly reachable only through
its HTTPS endpoint; the database does not need to be public.

## 4. Create the RDS PostgreSQL database

In AWS Console:

1. Open **RDS > Databases > Create database**.
2. Choose **Standard create** and **PostgreSQL**.
3. Select a currently supported PostgreSQL version.
4. Choose **Production** settings and select **Multi-AZ DB instance
  deployment**. Single-AZ does not meet the no-downtime target.
5. Start with an instance such as `db.t4g.small` only after checking current
   regional availability and expected load.
6. Enable storage autoscaling and set an appropriate maximum storage limit.
7. Set a unique master username and a generated strong password. This is the
   database credential, not the PUVerse super-admin credential.
8. Under connectivity, select the production VPC, the DB subnet group, and
   `puverse-rds` as the VPC security group.
9. Set **Public access** to **No**.
10. Enable automated backups for at least 7 days. Enable deletion protection
    for production.
11. Create the database and wait for **Available**.

Copy the endpoint from **Connectivity & security**. It looks similar to:

```text
puverse-prod.abc123.ap-south-1.rds.amazonaws.com
```

The final database URL is:

```text
postgresql://DB_USER:URL_ENCODED_DB_PASSWORD@RDS_ENDPOINT:5432/DB_NAME?sslmode=require
```

URL-encode any special characters in the password. For example, `@` becomes
`%40` and `#` becomes `%23`.

## 5. Create production secrets

Use **AWS Secrets Manager > Store a new secret > Other type of secret**.
Create one secret per environment variable so App Runner can map them clearly.
Use the names below, or an equivalent naming convention such as
`puverse/prod/DATABASE_URL`.

Create these secret values:

```text
DATABASE_URL=postgresql://...
JWT_SECRET=<long random value, at least 32 random characters>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PASSWORD_RESET_TOKEN_TTL=15m
SUPER_ADMIN_FULL_NAME=<initial administrator name>
SUPER_ADMIN_EMAIL=<initial administrator email>
SUPER_ADMIN_PASSWORD=<temporary strong password>
SMTP_HOST=<SMTP hostname>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<SMTP username>
SMTP_PASSWORD=<SMTP password or SES SMTP credential>
SMTP_FROM=PUVerse <verified-sender@example.com>
```

Use `SMTP_PORT=465` with `SMTP_SECURE=true` for implicit TLS, or port `587`
with `SMTP_SECURE=false` for STARTTLS, according to the provider.

For Amazon SES, verify the sender domain or address first. If the SES account
is still in the sandbox, verify every recipient used for testing or request
production access before launch.

Important:

- Do not reuse the RDS password as `SUPER_ADMIN_PASSWORD`.
- Do not put any of these values in `NEXT_PUBLIC_*` variables.
- Rotate any SMTP credential that has ever been committed or shared.
- Keep `SUPER_ADMIN_PASSWORD` only until the first login and password change.

## 6. Create the App Runner IAM instance role

App Runner needs an instance role to read the Secrets Manager values.

In **IAM > Roles > Create role**:

1. Select **Custom trust policy**.
2. Use this trust relationship:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "tasks.apprunner.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

3. Name the role `puverse-apprunner-instance`.
4. Attach a least-privilege policy allowing `secretsmanager:GetSecretValue`
   only for the PUVerse production secret ARNs. If the secrets use a customer
   KMS key, also allow `kms:Decrypt` for that key only.

Example policy shape:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:ap-south-1:ACCOUNT_ID:secret:puverse/prod/*"
    }
  ]
}
```

Do not use `Resource: "*"` in production unless there is no narrower option.

### 7.1 Create the App Runner ECR access role

Because the image is private in ECR, App Runner also needs a separate access
role to pull it. In **IAM > Roles > Create role**:

1. Select **Custom trust policy**.
2. Use this trust relationship:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "build.apprunner.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

3. Name the role `puverse-apprunner-ecr-access`.
4. Attach the AWS managed policy
   `AWSAppRunnerServicePolicyForECRAccess`.
5. Create the role.

## 7. Create ECR and build the API image in the Console

### 8.1 Create the ECR repository

1. Open **Amazon ECR > Repositories > Create repository**.
2. Repository name: `puverse-backend`.
3. Image tag mutability: **Immutable**.
4. Turn on **Scan on push**.
5. Leave encryption enabled with the default AWS managed key unless your
   organization requires a customer-managed KMS key.
6. Choose **Create repository**.
7. Open the repository and copy its **URI**. It looks like:
   `ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/puverse-backend`.

### 8.2 Create the CodeBuild service role

Open **IAM > Roles > Create role**:

1. Trusted entity: **AWS service**.
2. Use case: **CodeBuild**.
3. Name the role `puverse-codebuild-ecr`.
4. Attach `AmazonEC2ContainerRegistryPowerUser` and
   `CloudWatchLogsFullAccess` for the initial deployment.
5. Create the role.

For a stricter production policy, replace those managed policies with a
custom policy restricted to this ECR repository and the CodeBuild log group.

### 8.3 Create the CodeBuild project

Open **CodeBuild > Build projects > Create build project**:

1. Project name: `puverse-backend-image`.
2. Source provider: choose the provider containing this repository.
3. Connect the provider and select the PUVerse repository.
4. Branch: select the protected production branch.
5. Environment image: **Managed image**.
6. Operating system: **Ubuntu**.
7. Runtime: **Standard**.
8. Image: choose the latest available standard image.
9. Image mode: **Privileged**. Docker-in-Docker requires this.
10. Service role: select `puverse-codebuild-ecr`.
11. In **Environment variables**, add:

```text
REPOSITORY_URI=ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/puverse-backend
```

12. In **Buildspec**, choose **Insert build commands** and paste:

```yaml
version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR
      - aws ecr get-login-password --region "$AWS_DEFAULT_REGION" | docker login --username AWS --password-stdin "$REPOSITORY_URI"
      - IMAGE_TAG=$(echo "$CODEBUILD_RESOLVED_SOURCE_VERSION" | cut -c 1-7)
  build:
    commands:
      - docker build --platform linux/amd64 -t "$REPOSITORY_URI:$IMAGE_TAG" ./backend
  post_build:
    commands:
      - docker push "$REPOSITORY_URI:$IMAGE_TAG"
      - printf '[{"name":"puverse-backend","imageUri":"%s"}]' "$REPOSITORY_URI:$IMAGE_TAG" > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
```

13. Choose **Create build project**, then choose **Start build**.
14. Wait for a green **Succeeded** result.
15. Open ECR and confirm that a new image tag exists.
16. Copy the image URI including its tag. Use this immutable tag in App
    Runner, not `latest`.

For future releases, choose **Start build** after selecting the approved
commit or configure CodeBuild webhook builds from the protected branch.

## 8. Create an App Runner VPC connector

In **App Runner > VPC connectors > Create**:

1. Name it `puverse-prod-vpc-connector`.
2. Select the production VPC.
3. Select at least two private subnets.
4. Select `puverse-apprunner-vpc`.
5. Create the connector and wait until it is **Available**.

Ensure the private subnets have a route to the NAT gateway if the backend
needs to contact an external SMTP server. Without NAT, RDS access can work
while SMTP requests to the public internet fail.

## 9. Create the App Runner service

In **App Runner > Create service**:

1. Source: **Container registry**.
2. Provider: **Amazon ECR**.
3. Image: `$ECR_URI:$IMAGE_TAG`.
4. Deployment trigger: manual for the first launch. Enable automatic
   deployment later only from a protected production branch or release flow.
5. Service name: `puverse-backend-prod`.
6. Port: `3001`.
7. Protocol: `TCP`.
8. CPU and memory: start with 1 vCPU and 2 GB, then load test before sizing.
9. Minimum instances: 2. Maximum instances: 4 to start.
10. Health check protocol: `HTTP`.
11. Health check path: `/api/health`.
12. Health check port: `3001`.
13. Select `puverse-apprunner-ecr-access` as the ECR access role.
14. Select `puverse-apprunner-instance` as the instance role for runtime
  Secrets Manager access.
15. Attach the `puverse-prod-vpc-connector` under networking.

Set these plain environment variables:

```text
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://TEMPORARY_AMPLIFY_DOMAIN
```

For every secret, add an App Runner environment variable with the same name
and choose **Secrets Manager** as its source. Map all variables from Section
6, including `DATABASE_URL`, `JWT_SECRET`, SMTP values, and the bootstrap
administrator values.

Leave the start command empty for the normal service. The Dockerfile command
runs migrations and starts the API:

```text
npm run db:migrate:deploy && npm run start:prod
```

Create the service and wait for **Running**. Copy its default HTTPS domain.

## 10. Run the first database bootstrap

The container automatically applies migrations, but it does not run the seed.
For the **first deployment only**, set the App Runner start command to:

```text
npm run db:migrate:deploy && npm run db:seed && npm run start:prod
```

Deploy the configuration change and wait for the service to become healthy.
The seed reads `SUPER_ADMIN_*`, creates one `SUPER_ADMIN`, and sets
`mustChangePassword=true`. It refuses to create a second super admin.

Test the API:

```bash
export API_DOMAIN=<App Runner default domain>
curl -f "https://$API_DOMAIN/api/health"
```

After confirming the admin exists, log in from the frontend and immediately
change the temporary password. Then remove or rotate the bootstrap password
secret. Restore the normal App Runner start command:

```text
npm run db:migrate:deploy && npm run start:prod
```

For future deployments, keep the seed out of the startup command. The seed is
idempotent when an existing super admin is present, but it should not be part
of every container startup.

## 11. Verify the API before deploying the frontend

Run:

```bash
curl -f "https://$API_DOMAIN/api/health"
curl -I "https://$API_DOMAIN/api/docs"
```

Check App Runner logs for all of these:

- database connection established;
- migrations completed;
- SMTP verification succeeded, or a clear SMTP configuration warning;
- NestJS listening on port `3001`.

If the health check fails, check the App Runner logs first, then verify the
health path is `/api/health`, the service port is `3001`, and the RDS inbound
rule uses the VPC connector security group.

## 12. Deploy the frontend with Amplify

The root `amplify.yml` already sets `frontend` as the monorepo app root and
runs `npm ci` followed by `npm run build`.

In **AWS Amplify > Host your web app > New app**:

1. Connect GitHub, GitLab, or Bitbucket.
2. Select this repository.
3. Select the protected production branch.
4. Confirm the detected build specification is the root `amplify.yml`.
5. Add this environment variable:

```text
NEXT_PUBLIC_API_URL=https://API_DOMAIN/api
```

6. Save and deploy.
7. Open the generated Amplify HTTPS domain and test registration, login,
   event browsing, admin pages, password change, and password reset.

`NEXT_PUBLIC_API_URL` is embedded at build time. Changing it later requires a
new Amplify build and deployment.

Now replace the temporary `FRONTEND_URL` in App Runner with the real Amplify
HTTPS domain and redeploy the App Runner configuration. This value controls
CORS and is also used to build password-reset links.

## 13. Add a custom domain and HTTPS

### Frontend domain

In Amplify, open **Hosting > Custom domains > Add domain**:

1. Enter the domain, such as `puverse.example.com`.
2. Add the DNS records shown by Amplify at your DNS provider.
3. Wait for certificate validation and **Available** status.
4. Set App Runner `FRONTEND_URL` to the final HTTPS frontend URL.
5. Redeploy App Runner.

### API domain (optional)

In App Runner, add a custom domain such as `api.example.com` and complete the
provided DNS validation. After it is active:

1. Change Amplify `NEXT_PUBLIC_API_URL` to
   `https://api.example.com/api`.
2. Trigger a new Amplify deployment.
3. Verify `https://api.example.com/api/health`.

Never use HTTP for production frontend, API, or password-reset URLs.

## 14. Production verification checklist

Test the complete workflow from the public frontend:

- registration with a valid university email;
- login and logout;
- forced first-admin password change;
- event browsing and event creation permissions;
- student event registration;
- password-reset request and received email;
- password-reset link opens the final HTTPS frontend domain;
- admin and super-admin authorization boundaries;
- mobile layout and HTTPS browser behavior.

Also verify operational behavior:

- RDS is private and port `5432` is not open to the internet;
- RDS automated backup and deletion protection are enabled;
- an RDS restore test has been performed;
- App Runner logs are retained and CloudWatch alarms exist for errors,
  latency, CPU, memory, and instance health;
- ECR image scanning is enabled;
- App Runner deploys only approved images;
- Secrets Manager rotation or a documented rotation procedure exists;
- SES is out of sandbox for the expected email volume;
- the final admin bootstrap password has been removed or rotated;
- the frontend does not expose any secret or private endpoint.

## 15. Future release procedure from the Console

For each approved backend release, open **CodeBuild > Build projects >
puverse-backend-image > Start build**. Select the approved branch or commit,
wait for **Succeeded**, then copy the new immutable image tag from ECR. In
**App Runner > puverse-backend-prod > Deploy**, select the new ECR image tag
and deploy it. Wait for `/api/health` to pass before allowing the frontend
branch to deploy in Amplify.

For a frontend-only release, open **Amplify > the PUVerse app > the production
branch > Redeploy this version** or push the approved commit through the
connected Git provider. Amplify reads `amplify.yml` and builds `frontend`.

Then:

1. In App Runner, deploy the new immutable image tag.
2. Wait for the health check to pass.
3. Confirm migrations and application startup in the App Runner logs.
4. Open the Amplify production URL and test `/api/health`, authentication, and
  one normal business workflow.

Prisma migrations run during container startup. Never edit an already applied
migration. Add a new migration, test it against a restored database copy, and
deploy it with the application release.

For no-downtime releases, use the expand-and-contract pattern:

1. First deploy a migration that only adds nullable columns, new tables, or
  compatible indexes.
2. Deploy an API version that can work with both the old and new schema.
3. Backfill data with a controlled job or batched process.
4. Deploy the version that uses the new schema everywhere.
5. Remove old columns or constraints only in a later release after all old
  instances are gone.

Do not rename or remove a column in the same release that first deploys code
using the replacement column. App Runner keeps old instances serving traffic
while a new revision becomes healthy, so both schema versions must work during
the deployment window.

## 16. Rollback procedure

Keep at least one previous ECR image tag.

For an application-only failure:

1. In App Runner, deploy the previous known-good image tag.
2. Wait for `/api/health` to pass.
3. Verify login and the affected workflow.

Do not automatically roll back a database migration. If a migration has
already changed the schema, use a tested forward-fix migration or restore a
database backup under an incident plan. Take a snapshot before risky schema
changes.

## 17. Console troubleshooting

Use the service's **Logs**, **Events**, and **Configuration** tabs in the AWS
Console. Check CodeBuild logs first when the image is missing, App Runner logs
when the service is unhealthy, and RDS connectivity/security groups when the
database cannot be reached.

Common causes of failure:

- `P1001` or database timeout: wrong URL, private subnet route, missing VPC
  connector, or missing `puverse-rds` inbound rule.
- App Runner health-check failure: using `/health` instead of `/api/health`,
  wrong port, or migrations failing before NestJS starts.
- CORS errors: `FRONTEND_URL` is not the exact HTTPS Amplify/custom domain.
- Password reset failure: SMTP values are incomplete, SMTP egress needs NAT,
  sender is not verified, or SES is still in sandbox.
- Frontend calls the wrong API: `NEXT_PUBLIC_API_URL` was changed without a
  new Amplify build, or `/api` was omitted from the URL.

## 18. Cleanup and cost controls

When deleting a test environment, delete resources in this order only after
confirming data is not needed:

1. Amplify app and custom domain.
2. App Runner service and VPC connector.
3. ECR images and repository.
4. RDS final snapshot, then database if approved.
5. NAT gateway, Elastic IP, unused security groups, and VPC resources.
6. Secrets only after retaining any required audit or recovery copy.

NAT gateways, RDS instances, App Runner, data transfer, and email delivery can
all incur charges. Set AWS Budgets and billing alerts before production use.
