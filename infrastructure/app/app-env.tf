resource "kubernetes_secret" "app_env" {
  metadata {
    name      = "app-env"
    namespace = var.namespace
  }

  data = {
    POSTGRES_PRISMA_URL = var.database_url
  }

  type = "Opaque"
}