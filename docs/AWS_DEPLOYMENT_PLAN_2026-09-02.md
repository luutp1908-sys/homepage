# Homepage AWS Deployment Plan

Date: 2026-09-02
Status: Draft
Owner: Homepage + Infra

## Goal
Deploy the homepage as a containerized Next.js app on AWS using ECS/Fargate behind an ALB, while reusing the existing backend deployment patterns and keeping the embedded editor remote hosted separately on CloudFront.

## Checklist
- [x] Confirm ECS/Fargate + ALB as the homepage production host; do not use S3-only static hosting.
	- This app depends on Next.js server-side behavior, auth cookies, and API routes, so static-only hosting is not suitable.
- [x] Reuse the existing backend AWS pattern as the infra baseline.
- [x] Add or verify a Dockerfile and production start command for the homepage app.
- [x] Extend the existing `be/infra` Terraform for ECR, ECS service, task definition, ALB, target group, security groups, logs, and IAM roles.
	- [x] Define the homepage ECS/Fargate service inputs in `be/infra/environments/prod`.
	- [x] Provision or reuse the ECR repository in `be/infra/modules/ecr`.
	- [x] Provision the ALB listener, target group, and health check settings in `be/infra/modules/alb`.
	- [x] Provision the ECS task definition, execution role, and task role in `be/infra/modules/ecs`.
	- [x] Provision the CloudWatch log group for the homepage service from the existing infra stack.
	- [x] Provision the service security group and any required network rules in `be/infra/modules/security`.
	- [x] Add autoscaling and service deployment wiring through the prod environment entrypoint.
- [x] Wire production runtime variables into the task definition.
- [x] Build a GitHub Actions workflow for OIDC-authenticated deploys to AWS.
- [ ] Confirm the homepage can reach the backend ALB and auth flows still work in production.
- [ ] Confirm the embedded editor remote still resolves from the CloudFront URL.
- [ ] Add rollback notes and smoke-test steps to this document.

## Task Details

### [x] 1. Hosting model
Confirm ECS/Fargate behind an ALB as the homepage production host so the app can keep Next.js server-side behavior, auth cookies, and API routes.

- [x] Verify the homepage cannot be safely treated as an S3-only static export.
- [x] Record the production hostname and ALB target for the homepage service.

### [x] 2. Infra baseline
Mirror the backend infrastructure shape already used in production instead of inventing a separate deployment model.

### [x] 3. Container runtime
Make sure the homepage production image starts through the existing production env bootstrap path and works without manual shell setup.

- [x] Added [homepage/Dockerfile](../Dockerfile) and verified `yarn build` succeeds.

### [~] 4. AWS resources
Provision the homepage service by extending the existing `be/infra` stack with ECR, ECS, ALB, target group, autoscaling, CloudWatch logs, security groups, and IAM execution/task roles.

### [ ] 5. Runtime env wiring
Set `BE_URL`, `NEXT_PUBLIC_BASE_URL`, and `NEXT_PUBLIC_EDITOR_REMOTE_URL_PROD` from production infrastructure outputs.

### [x] 6. Deploy workflow
Add a CI workflow that builds the homepage image, pushes it to ECR, updates ECS, and waits for service stability.

- [x] Added [homepage/.github/workflows/deploy-homepage-prod.yml](../.github/workflows/deploy-homepage-prod.yml) with OIDC auth, image build/push, ECS deploy, and ALB smoke check.

### [ ] 7. Production verification
Validate the homepage ALB endpoint, login redirects, authenticated API calls, and embedded editor loading.

### [ ] 8. Rollback and ops notes
Document how to redeploy, roll back, and run smoke checks after changes.

## References
- [homepage/package.json](../package.json)
- [homepage/scripts/start-with-production-env.cjs](../scripts/start-with-production-env.cjs)
- [homepage/.env.production](../.env.production)
- [be/infra/environments/prod/terraform.tfvars](../../be/infra/environments/prod/terraform.tfvars)
- [be/.github/workflows/deploy-prod.yml](../../be/.github/workflows/deploy-prod.yml)
