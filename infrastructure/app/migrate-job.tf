resource "kubernetes_job" "db_migration" {
  metadata {
    name      = "spotify-ultimate-recap-db-migration"
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
