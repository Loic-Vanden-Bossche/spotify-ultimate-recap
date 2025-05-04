variable "namespace" {
  description = "The namespace in which to deploy the app resources."
  type        = string
}

variable "image" {
  description = "Docker image for the backend"
  type        = string
}

variable "database_url" {
  description = "Database connection string"
  type        = string
  sensitive   = true
}

variable "domain" {
  description = "Domain for the app service"
  type        = string
}

variable "docker_secret_name" {
  description = "Name of the Docker secret"
  type        = string
}

variable "migrate_image" {
  description = "Docker image for the db migrations"
  type        = string
}

variable "migrate_db" {
  description = "Whether to run the migration job"
  type        = bool
}