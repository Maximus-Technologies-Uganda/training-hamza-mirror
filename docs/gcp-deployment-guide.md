# GCP Deployment Guide for training-hamza

This guide explains how to deploy the Blog Posts API to Google Cloud Run using Terraform, GitHub Actions, and Workload Identity Federation (WIF).

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  GitHub Actions │────▶│ Artifact        │────▶│   Cloud Run     │
│  (CI/CD)        │     │ Registry        │     │   (Blog API)    │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         │ WIF Auth
         ▼
┌─────────────────┐
│ Workload        │
│ Identity Pool   │
└─────────────────┘
```

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

| Variable Name | Value |
|--------------|-------|
| `GCP_PROJECT_ID` | `proj-rms-dev` |
| `GCP_REGION` | `us-central1` |
| `GCP_SERVICE_NAME` | `blog-api-dev` |
| `GCP_ARTIFACT_REGISTRY` | `us-central1-docker.pkg.dev/proj-rms-dev/training-hamza` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | `github-actions-deployer@proj-rms-dev.iam.gserviceaccount.com` |

> **Note**: Get the exact values from `terraform output` command.

### 3.3 Create GitHub Environment (Optional)

For environment-specific deployments:
1. Go to **Settings** > **Environments**
2. Create a new environment called `dev`
3. Add protection rules if needed

## Step 4: Verify Deployment Pipeline

### 4.1 Trigger a Deployment

You can trigger deployment by:

1. **Push changes** to `src/blog/**` files
2. **Manual trigger**: Go to Actions > "Deploy Blog API to Cloud Run" > "Run workflow"

### 4.2 Monitor the Deployment

1. Go to **Actions** tab in GitHub
2. Watch the workflow progress
3. Check the deployment summary for the service URL

### 4.3 Verify in GCP Console

```powershell
# List Cloud Run services
gcloud run services list --region=us-central1

# Get service details
gcloud run services describe blog-api-dev --region=us-central1

# View logs
gcloud run services logs read blog-api-dev --region=us-central1 --limit=50
```

## Step 5: Test the Deployed API

```powershell
# Get the service URL
$SERVICE_URL = gcloud run services describe blog-api-dev --region=us-central1 --format="value(status.url)"

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
# Check service status
gcloud run services describe blog-api-dev --region=us-central1

# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=blog-api-dev" \
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

```powershell
# === GCP Authentication ===
gcloud auth login
gcloud auth application-default login
gcloud config set project proj-rms-dev

# === Terraform ===
terraform init
terraform plan
terraform apply
terraform output

# === Cloud Run ===
gcloud run services list --region=us-central1
gcloud run services describe blog-api-dev --region=us-central1
gcloud run services logs read blog-api-dev --region=us-central1

# === Docker (local testing) ===
docker build -t blog-api .
docker run -p 8080:8080 blog-api

# === Artifact Registry ===
gcloud artifacts repositories list --location=us-central1
```

## Security Notes

1. **No service account keys**: WIF eliminates the need for long-lived credentials
2. **Least privilege**: Service accounts have only required permissions
3. **Repository restrictions**: WIF is restricted to your GitHub organization
4. **Secrets management**: Use Secret Manager for sensitive configuration
