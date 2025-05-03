resource "kubernetes_secret" "app_env" {
  metadata {
    name      = "app-env"
    namespace = var.namespace
  }

  data = {
    DB_URL      = var.database_url
    DB_USERNAME = var.database_username
    DB_PASSWORD = var.database_password
  }

  type = "Opaque"
}