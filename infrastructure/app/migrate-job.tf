resource "random_id" "db_migration" {
  count = var.migrate_db ? 1 : 0

  byte_length = 4
}

resource "kubernetes_job" "db_migration" {
  count = var.migrate_db ? 1 : 0

  metadata {
    name      = "spotify-ultimate-recap-db-migration-${random_id.db_migration[count.index].hex}"
    namespace = var.namespace

    labels = {
      app = "spotify-ultimate-recap"
    }
  }

  spec {
    backoff_limit              = 0
    ttl_seconds_after_finished = 300 # Clean up after 5 minutes
    template {
      metadata {
        labels = {
          app = "spotify-ultimate-recap"
        }
      }

      spec {
        restart_policy = "Never"
        container {
          name  = "prisma-migrate"
          image = var.migrate_image

          env_from {
            secret_ref {
              name = kubernetes_secret.app_env.metadata[0].name
            }
          }
        }
      }
    }
  }
}
