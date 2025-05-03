output "url" {
  value       = "postgresql://${var.database_username}:${var.database_password}@${kubernetes_service.postgres.metadata[0].name}.${var.namespace}.svc.cluster.local:5432/${var.database_name}"
  description = "Database connection string"
  sensitive   = true
}