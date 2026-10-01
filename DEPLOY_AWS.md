# Deploying PUVerse on AWS

This guide is written for a production launch with a growing audience. It
uses managed AWS services so you can scale without managing servers:

- **AWS Amplify Hosting**: Next.js website, CDN, HTTPS, and frontend deploys.
- **Amazon ECR + App Runner**: NestJS API containers and automatic scaling.
- **Amazon RDS for PostgreSQL**: durable application data and backups.
- **AWS Secrets Manager**: database, SMTP, JWT, and administrator secrets.

The examples use `ap-south-1` (Mumbai). Use one AWS region for all services.
The API must be deployed before the frontend because
`NEXT_PUBLIC_API_URL` is embedded into the Next.js build.

## Before you start

You need:

1. An AWS account with billing enabled.
2. An IAM user or role with permission to create RDS, ECR, App Runner,
  Amplify, VPC, IAM, and Secrets Manager resources.
3. Docker, Node.js 24+, npm, and the AWS CLI installed locally.
4. This repository pushed to GitHub, GitLab, or Bitbucket for Amplify.
5. A domain name, if you want a branded URL instead of AWS URLs.

For a larger audience, plan a budget for RDS, App Runner, data transfer, and
email delivery. Start with the smallest production sizes, enable monitoring,
and increase capacity after observing real traffic.

## 1. Select the AWS region

In the AWS Console, select `ap-south-1` in the region selector. The commands
below assume that region:

```bash
export AWS_REGION=ap-south-1
aws configure set region "$AWS_REGION"
aws sts get-caller-identity
```

The final command must return your AWS account. If it returns an access
denied error, ask the AWS administrator to grant deployment permissions before
continuing.

## 2. Create the PostgreSQL database

In the AWS Console:

1. Open **RDS > Databases > Create database**.
2. Select **Standard create**, engine **PostgreSQL**, and a supported current
  PostgreSQL version.
3. Select **Production** for a public launch. Use Multi-AZ when downtime is
  unacceptable; otherwise start with a Single-AZ instance and enable backups.
4. Choose a DB instance size appropriate for expected traffic, for example
  `db.t4g.small` to start. Enable storage autoscaling.
5. Set a strong master username and password. Do not use the application
  `SUPER_ADMIN` password for the database.
6. Under connectivity, use the default VPC, disable public access, and create
  or select a security group named `puverse-rds`.
7. Set automated backups to at least 7 days and enable deletion protection for
  production.
8. Create the database and wait until its status is **Available**.

Copy the RDS endpoint from **Connectivity & security**. The application URL
will look like this:

```text
postgresql://DB_USER:DB_PASSWORD@RDS_ENDPOINT:5432/DB_NAME?sslmode=require
```

Do not open PostgreSQL to `0.0.0.0/0`. Later, allow port `5432` only from the
App Runner VPC connector security group.

## 3. Store production secrets

Open **AWS Secrets Manager > Store a new secret > Other type of secret** and
create secrets for the values below. Use generated random values for
`JWT_SECRET` and `SUPER_ADMIN_PASSWORD`.

```text
DATABASE_URL
JWT_SECRET
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
PASSWORD_RESET_TOKEN_TTL=15m
SUPER_ADMIN_FULL_NAME
SUPER_ADMIN_EMAIL
SUPER_ADMIN_PASSWORD
```

Never commit these values to Git, paste them into frontend variables, or put
them in a public issue. Rotate the SMTP app password that was previously
exposed in the old example environment file.

## 4. Build and publish the API image

From the repository root, authenticate Docker with ECR and push the API:

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPOSITORY=puverse-backend
export ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY"

aws ecr create-repository \
  --repository-name "$ECR_REPOSITORY" \
  --image-scanning-configuration scanOnPush=true \
  --region "$AWS_REGION"

aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin \
  "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

docker build -t "$ECR_REPOSITORY:latest" ./backend
docker tag "$ECR_REPOSITORY:latest" "$ECR_URI:latest"
docker push "$ECR_URI:latest"
```

If the repository already exists, the create command can be skipped.

## 5. Deploy the API with App Runner

In the AWS Console:

1. Open **App Runner > Create an App Runner service**.
2. For source, choose **Container registry**, **Amazon ECR**, and the image
  `$ECR_URI:latest`.
3. Set deployment to automatic for a trusted production branch, or manual if
  you want to approve every release.
4. Set the service port to `3001` and protocol to `TCP`.
5. Leave the start command empty. The image runs migrations and starts NestJS.
6. Set the health check path to `/health`.
7. Start with 1 vCPU and 2 GB memory. For more traffic, raise the maximum
  instance count and configure concurrency after load testing.
8. Add these non-secret variables:

```text
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://TEMPORARY_FRONTEND_DOMAIN
```

9. Add the secret values from Secrets Manager to the App Runner service. Use
  the App Runner instance role with read access to the selected secrets.
10. Create the service and wait for status **Running**.

Copy the App Runner default domain, then verify:

```bash
curl -f https://API_DOMAIN/health
```

The response should show that the application is healthy. The API endpoints
are under `https://API_DOMAIN/api` and Swagger is at `https://API_DOMAIN/api/docs`.

## 6. Deploy the frontend with Amplify

The repository contains the root-level `amplify.yml` build specification.
In the AWS Console:

1. Open **Amplify > Host your web app > New app**.
2. Connect the Git provider and select this repository and production branch.
3. Confirm the monorepo build uses `frontend` as `appRoot` from `amplify.yml`.
4. Add this environment variable under **Environment variables**:

```text
NEXT_PUBLIC_API_URL=https://API_DOMAIN/api
```

5. Save and deploy. Amplify builds the Next.js app and gives you a default
  HTTPS domain.
6. Return to App Runner and replace `FRONTEND_URL` with the Amplify domain.
  Deploy the API configuration change.
7. Test registration, login, event browsing, and password reset from the
  Amplify URL.

## 7. Add a custom domain

In Amplify, open **Hosting > Custom domains > Add domain**. Follow the DNS
records shown by Amplify. Use HTTPS and wait until the certificate status is
**Available**.

Update App Runner's `FRONTEND_URL` to the final HTTPS frontend URL. If the API
also needs a branded domain, add a custom domain in App Runner and use that
domain in Amplify's `NEXT_PUBLIC_API_URL`, then redeploy the frontend.

## 8. First administrator and database migrations

Every new API container runs:

```text
prisma migrate deploy
```

Keep the `backend/prisma/migrations` directory in Git. On the first launch,
the configured `SUPER_ADMIN_*` values bootstrap the initial administrator
according to the application logic. Log in once, verify the account, and
rotate or remove the bootstrap password from Secrets Manager.

## 9. Production checks for a larger audience

Before announcing the application:

- Enable RDS deletion protection, automated backups, and a backup restore test.
- Enable App Runner automatic deployments only from the protected production
  branch.
- Keep RDS private and restrict security groups to required traffic.
- Enable CloudWatch logs and alarms for API errors, latency, CPU, memory, and
  RDS storage/connections.
- Start with App Runner minimum 1 and maximum 2 instances, then increase the
  maximum after load testing.
- Use RDS Proxy or connection pooling if database connections become a limit.
- Use Amazon SES for higher-volume password-reset email instead of a Gmail
  SMTP account.
- Test a rollback by deploying a previously known-good image tag.

## Local verification

```bash
cd backend && npm ci && npm run build
cd ../frontend && npm ci && npm run build
```

The frontend production build must receive `NEXT_PUBLIC_API_URL` in Amplify.