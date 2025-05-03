variable "kubeconfig_path" {
  description = "Path to kubeconfig file"
  type        = string
  default     = "~/.kube/config"
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "spotify-ultimate-recap"
}

variable "database_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "repository_name" {
  description = "GitHub repository name"
  type        = string
}

variable "domain" {
  description = "Domain for the app service"
  type        = string
  default     = "spotify-ultimate-recap.chbrx.com"
}