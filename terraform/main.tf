# =============================================================================
# Terraform Configuration for Blog Posts API - GCP Cloud Run Deployment
# =============================================================================
# This configuration sets up:
# - Workload Identity Federation (WIF) for GitHub Actions authentication
# - Artifact Registry for Docker images
# - Cloud Run service for the Blog Posts API
# - Secret Manager for sensitive configuration
# - IAM bindings for secure access
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state storage (GCS)
  backend "gcs" {
    bucket = "proj-rms-dev-terraform-state"
    prefix = "training-hamza/blog-api"
  }
}

# =============================================================================
# Provider Configuration
# =============================================================================
provider "google" {
  project = var.project_id
  region  = var.region
}

# =============================================================================
# Variables
# =============================================================================
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "proj-rms-dev"
}

variable "region" {
  description = "GCP Region for resources"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "github_org" {
  description = "GitHub organization name"
  type        = string
  default     = "Maximus-Technologies-Uganda"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "training-hamza"
}

variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "blog-api"
}

# =============================================================================
# Local Values
# =============================================================================
locals {
  # Full service name with environment prefix
  full_service_name = "${var.service_name}-${var.environment}"
  
  # Artifact Registry repository name
  artifact_repo = "training-hamza"
  
  # Common labels for all resources
  labels = {
    project     = "training-hamza"
    environment = var.environment
    managed-by  = "terraform"
  }
}

# =============================================================================
# Enable Required APIs
# =============================================================================
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "secretmanager.googleapis.com",
    "firestore.googleapis.com",
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# =============================================================================
# Firestore Database
# =============================================================================
# Creates the (default) Firestore database in Native mode for the Blog API.
# Note: A project can only have one (default) database. If you already have
# a Firestore database in this project, you may need to import it or use a
# named database instead.
resource "google_firestore_database" "default" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  # Prevents accidental deletion of the database
  deletion_policy = "DELETE"

  depends_on = [google_project_service.apis]
}

# =============================================================================
# Artifact Registry - Docker Repository
# =============================================================================
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = local.artifact_repo
  description   = "Docker repository for training-hamza project"
  format        = "DOCKER"
  labels        = local.labels

  depends_on = [google_project_service.apis]
}

# =============================================================================
# Workload Identity Federation - GitHub Actions Authentication
# =============================================================================

# Workload Identity Pool
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Pool"
  description               = "Identity pool for GitHub Actions CI/CD"

  depends_on = [google_project_service.apis]
}

# Workload Identity Pool Provider (GitHub OIDC)
resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Actions Provider"
  description                        = "OIDC provider for GitHub Actions"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  # Restrict to specific GitHub organization
  attribute_condition = "assertion.repository_owner == '${var.github_org}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# =============================================================================
# Service Account for GitHub Actions Deployments
# =============================================================================
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-deployer"
  display_name = "GitHub Actions Deployer"
  description  = "Service account for GitHub Actions CI/CD deployments"
}

# Allow GitHub Actions to impersonate the service account via WIF
resource "google_service_account_iam_member" "github_actions_wif" {
  service_account_id = google_service_account.github_actions.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_org}/${var.github_repo}"
}

# Grant service account permissions to deploy to Cloud Run
resource "google_project_iam_member" "github_actions_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant service account permissions to push to Artifact Registry
resource "google_project_iam_member" "github_actions_artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant service account permissions to act as the Cloud Run service account
resource "google_project_iam_member" "github_actions_service_account_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# NOTE: Secret Manager access is commented out until secrets are needed
# Uncomment when you need to access secrets from GitHub Actions or Cloud Run
# resource "google_project_iam_member" "github_actions_secret_accessor" {
#   project = var.project_id
#   role    = "roles/secretmanager.secretAccessor"
#   member  = "serviceAccount:${google_service_account.github_actions.email}"
# }

# =============================================================================
# Service Account for Cloud Run Runtime
# =============================================================================
resource "google_service_account" "cloud_run" {
  account_id   = "${var.service_name}-runner"
  display_name = "Blog API Cloud Run Service Account"
  description  = "Service account for Blog API Cloud Run service runtime"
}

# Allow Cloud Run service to access Firestore (Datastore mode)
resource "google_project_iam_member" "cloud_run_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# NOTE: Secret Manager access for Cloud Run is commented out until secrets are needed
# resource "google_project_iam_member" "cloud_run_secret_accessor" {
#   project = var.project_id
#   role    = "roles/secretmanager.secretAccessor"
#   member  = "serviceAccount:${google_service_account.cloud_run.email}"
# }

# =============================================================================
# Secret Manager - Application Secrets
# =============================================================================

# Example: API secret (create the secret, value added manually or via CI)
resource "google_secret_manager_secret" "api_secret" {
  secret_id = "${local.full_service_name}-api-secret"
  
  labels = local.labels

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

# =============================================================================
# Cloud Run Service
# =============================================================================
resource "google_cloud_run_v2_service" "blog_api" {
  name     = local.full_service_name
  location = var.region
  
  labels = local.labels

  template {
    service_account = google_service_account.cloud_run.email
    
    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    containers {
      # Initial placeholder image - will be updated by CI/CD
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true  # Scale to zero when idle
      }

      ports {
        container_port = 8080
      }

      # Environment variables
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      env {
        name  = "STORAGE_TYPE"
        value = "firestore"
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "FIRESTORE_COLLECTION"
        value = "posts"
      }

      # Health check
      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 5
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 10
        timeout_seconds       = 3
        period_seconds        = 30
      }
    }
  }

  # Traffic configuration
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.docker_repo,
    google_firestore_database.default
  ]

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,  # Image updated by CI/CD
      client,
      client_version,
    ]
  }
}

# NOTE: Public access is intentionally NOT enabled.
# The API requires authentication for security.
# To allow specific users/service accounts, add IAM bindings like:
# resource "google_cloud_run_v2_service_iam_member" "invoker" {
#   project  = var.project_id
#   location = var.region
#   name     = google_cloud_run_v2_service.blog_api.name
#   role     = "roles/run.invoker"
#   member   = "serviceAccount:some-service@project.iam.gserviceaccount.com"
# }

# =============================================================================
# Outputs
# =============================================================================
output "cloud_run_url" {
  description = "URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.blog_api.uri
}

output "artifact_registry_url" {
  description = "URL of the Artifact Registry repository"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${local.artifact_repo}"
}

output "workload_identity_provider" {
  description = "Full identifier for the Workload Identity Provider (use in GitHub Actions)"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "service_account_email" {
  description = "Email of the GitHub Actions service account"
  value       = google_service_account.github_actions.email
}

output "cloud_run_service_account" {
  description = "Email of the Cloud Run runtime service account"
  value       = google_service_account.cloud_run.email
}

# GitHub Actions configuration output
output "github_actions_config" {
  description = "Configuration values for GitHub Actions workflow"
  value = {
    workload_identity_provider = google_iam_workload_identity_pool_provider.github.name
    service_account            = google_service_account.github_actions.email
    artifact_registry          = "${var.region}-docker.pkg.dev/${var.project_id}/${local.artifact_repo}"
    cloud_run_service          = local.full_service_name
    region                     = var.region
  }
}

output "github_actions_secrets" {
  description = "Values to add as GitHub repository secrets/variables"
  value = <<-EOT
    
    ============================================================
    Add these as GitHub Repository Variables (Settings > Secrets and variables > Actions > Variables):
    ============================================================
    
    GCP_PROJECT_ID:                 ${var.project_id}
    GCP_REGION:                     ${var.region}
    GCP_SERVICE_NAME:               ${local.full_service_name}
    GCP_ARTIFACT_REGISTRY:          ${var.region}-docker.pkg.dev/${var.project_id}/${local.artifact_repo}
    GCP_WORKLOAD_IDENTITY_PROVIDER: ${google_iam_workload_identity_pool_provider.github.name}
    GCP_SERVICE_ACCOUNT:            ${google_service_account.github_actions.email}
    
    ============================================================
    EOT
}
