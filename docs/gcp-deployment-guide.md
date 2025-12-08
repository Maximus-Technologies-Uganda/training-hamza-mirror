# GCP Deployment Guide for training-hamza

This guide explains how to deploy the Blog Posts API to Google Cloud Run using Terraform, GitHub Actions, and Workload Identity Federation (WIF).

## Architecture Overview

```text
+-------------------+      +-------------------+      +-------------------+
|  GitHub Actions   |----->|    Artifact       |----->|    Cloud Run      |
|  (CI/CD)          |      |    Registry       |      |    (Blog API)     |
+--------+----------+      +-------------------+      +-------------------+
         |
         | WIF Auth
         v
+-------------------+
|    Workload       |
|  Identity Pool    |
+-------------------+
```

**Flow**: GitHub Actions authenticates via Workload Identity Federation (WIF), pushes Docker images to Artifact Registry, then deploys to Cloud Run.

## Prerequisites

1. **GCP Access**: You must have access to `proj-rms-dev` project (devs group)
2. **Google Cloud SDK**: Install from https://cloud.google.com/sdk/docs/install
3. **Terraform**: Install from https://terraform.io/downloads
4. **GitHub Admin Access**: To configure repository secrets/variables

## Step 1: Initial GCP Setup

### 1.1 Authenticate to GCP

```powershell
# Login to GCP
gcloud auth login

# Set the project
gcloud config set project proj-rms-dev

# Verify access
gcloud projects describe proj-rms-dev
```

### 1.2 Enable Application Default Credentials (for Terraform)

```powershell
gcloud auth application-default login
```

## Step 2: Apply Terraform Infrastructure

### 2.1 Initialize Terraform

```powershell
cd terraform

# Initialize Terraform (downloads providers)
terraform init
```

### 2.2 Review the Plan

```powershell
# See what will be created
terraform plan
```

### 2.3 Apply Infrastructure

```powershell
# Create all resources
terraform apply
```

When prompted, type `yes` to confirm.

### 2.4 Save the Outputs

After applying, Terraform will output important values. Save these for the next step:

```powershell
# View outputs
terraform output
```

## Step 3: Link GitHub Repository to GCP

### 3.1 Get Terraform Output Values

```powershell
terraform output github_actions_secrets
```

### 3.2 Add GitHub Repository Variables

Go to your GitHub repository:
1. Navigate to **Settings** > **Secrets and variables** > **Actions**
2. Click on **Variables** tab
3. Add the following repository variables:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `GCP_PROJECT_ID` | `proj-rms-dev` | Your GCP project ID |
| `GCP_REGION` | `us-central1` | Change per environment if needed |
| `GCP_SERVICE_NAME` | `blog-api-dev` | Format: `blog-api-{env}` (e.g., `blog-api-staging`, `blog-api-prod`) |
| `GCP_ARTIFACT_REGISTRY` | `us-central1-docker.pkg.dev/proj-rms-dev/training-hamza` | Region-specific |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | *(see below)* | **Must get from terraform output** |
| `GCP_SERVICE_ACCOUNT` | `github-actions-deployer@proj-rms-dev.iam.gserviceaccount.com` | From terraform output |

> **Important**: Get the **exact values** from `terraform output github_actions_secrets` command.
>
> **⚠️ WIF Provider Warning**: The `GCP_WORKLOAD_IDENTITY_PROVIDER` value must be the **full path** from terraform output (e.g., `projects/123456789/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider`). Do NOT use the placeholder `PROJECT_NUMBER`—replace it with your actual GCP project number. Run:
> ```powershell
> terraform output workload_identity_provider
> ```

### 3.3 Create GitHub Environments (Optional but Recommended)

For environment-specific deployments with proper controls, create a GitHub Environment for each target:

1. Go to **Settings** > **Environments**
2. Create environments for each deployment target:

| Environment | Protection Rules | Reviewers |
|-------------|------------------|------------|
| `dev` | None (auto-deploy) | — |
| `staging` | Required reviewers | Team leads |
| `prod` | Required reviewers + wait timer | Senior devs / DevOps |

3. For each environment, add **environment-specific variables** (overrides repository variables):

   | Variable | dev | staging | prod |
   |----------|-----|---------|------|
   | `GCP_SERVICE_NAME` | `blog-api-dev` | `blog-api-staging` | `blog-api-prod` |
   | `GCP_REGION` | `us-central1` | `us-central1` | `us-east1` (example) |

4. **Map workflow inputs to environments**: When running the workflow, select the target environment. The workflow should use the environment's variables:
   - Ensure your workflow file uses `environment: ${{ inputs.environment }}` to load the correct variables
   - Each environment should have a corresponding `terraform/environments/{env}.tfvars` file

> **Preventing Drift**: Always run `terraform apply -var-file="environments/{env}.tfvars"` for the matching environment to ensure infrastructure and GitHub variables stay in sync.

## Step 4: Verify Deployment Pipeline

### 4.1 Trigger a Deployment

Deployments are triggered manually via the GitHub Actions UI:

1. **Manual trigger**: Go to Actions > "Deploy Blog API to Cloud Run" > "Run workflow"
2. Select the target environment (dev, staging, or prod)
3. Click "Run workflow"

### 4.2 Monitor the Deployment

1. Go to **Actions** tab in GitHub
2. Watch the workflow progress
3. Check the deployment summary for the service URL

### 4.3 Verify in GCP Console

> **Environment Variables**: Replace `$SERVICE_NAME` and `$REGION` with your target environment values:
> - **dev**: `blog-api-dev`, `us-central1`
> - **staging**: `blog-api-staging`, `us-central1` (or your staging region)
> - **prod**: `blog-api-prod`, `us-central1` (or your production region)

```powershell
# Set environment variables (adjust for your target environment)
$SERVICE_NAME = "blog-api-dev"  # Change to blog-api-staging or blog-api-prod
$REGION = "us-central1"         # Change if using different region per environment

# List Cloud Run services
gcloud run services list --region=$REGION

# Get service details
gcloud run services describe $SERVICE_NAME --region=$REGION

# View logs
gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=50
```

## Step 5: Test the Deployed API

```powershell
# Set environment variables (adjust for your target environment)
$SERVICE_NAME = "blog-api-dev"  # Change to blog-api-staging or blog-api-prod
$REGION = "us-central1"         # Change if using different region per environment

# Get the service URL
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"

# Test health endpoint
curl "$SERVICE_URL/health"

# Test API
curl "$SERVICE_URL/api/posts"

# View API documentation
Start-Process "$SERVICE_URL/docs"
```

## Troubleshooting

### WIF Authentication Errors

If you see `Error: Unable to authenticate`:
1. Verify the Workload Identity Pool is correctly configured
2. Check the `attribute_condition` in Terraform matches your GitHub org
3. Ensure the repository variable values are exact matches

```powershell
# Verify WIF pool
gcloud iam workload-identity-pools describe github-actions-pool \
  --location=global

# Verify provider
gcloud iam workload-identity-pools providers describe github-provider \
  --workload-identity-pool=github-actions-pool \
  --location=global
```

### Permission Denied Errors

```powershell
# Check service account permissions
gcloud projects get-iam-policy proj-rms-dev \
  --filter="bindings.members:github-actions-deployer@proj-rms-dev.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

### Cloud Run Deployment Failures

```powershell
# Set your target environment
$SERVICE_NAME = "blog-api-dev"  # Adjust for staging/prod
$REGION = "us-central1"

# Check service status
gcloud run services describe $SERVICE_NAME --region=$REGION

# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" `
  --limit=20 --format="table(timestamp,textPayload)"
```

## Using Existing Service Accounts

If your team has existing service accounts:

1. Update `terraform/terraform.tfvars`:
   ```hcl
   # Use existing service account (if available)
   # github_actions_sa = "existing-deployer@proj-rms-dev.iam.gserviceaccount.com"
   ```

2. Or update the GitHub variable directly:
   - Change `GCP_SERVICE_ACCOUNT` to the existing account email

## Environment-Specific Deployments

For multiple environments (dev, staging, prod):

1. Create separate terraform workspaces:
   ```powershell
   terraform workspace new staging
   terraform workspace new prod
   ```

2. Create environment-specific tfvars:
   ```powershell
   # terraform/environments/staging.tfvars
   environment = "staging"
   ```

3. Apply with environment file:
   ```powershell
   terraform apply -var-file="environments/staging.tfvars"
   ```

## Quick Reference Commands

> **Note**: Set `$SERVICE_NAME` and `$REGION` to match your target environment before running Cloud Run commands.

```powershell
# === Environment Variables (set these first) ===
$SERVICE_NAME = "blog-api-dev"  # Change for staging/prod
$REGION = "us-central1"         # Change if different per environment

# === GCP Authentication ===
gcloud auth login
gcloud auth application-default login
gcloud config set project proj-rms-dev

# === Terraform ===
terraform init
terraform plan
terraform apply
terraform output
terraform output workload_identity_provider  # Get WIF provider value

# === Cloud Run ===
gcloud run services list --region=$REGION
gcloud run services describe $SERVICE_NAME --region=$REGION
gcloud run services logs read $SERVICE_NAME --region=$REGION

# === Docker (local testing) ===
docker build -t blog-api .
docker run -p 8080:8080 blog-api

# === Artifact Registry ===
gcloud artifacts repositories list --location=$REGION
```

## Security Notes

1. **No service account keys**: WIF eliminates the need for long-lived credentials
2. **Least privilege**: Service accounts have only required permissions
3. **Repository restrictions**: WIF is restricted to your GitHub organization
4. **Secrets management**: Use Secret Manager for sensitive configuration
