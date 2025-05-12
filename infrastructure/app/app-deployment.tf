resource "kubernetes_deployment" "app" {
  metadata {
    name      = "spotify-ultimate-recap-app"
    namespace = var.namespace
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "spotify-ultimate-recap-app"
      }
    }
    template {
      metadata {
        labels = {
          app = "spotify-ultimate-recap-app"
        }
      }
      spec {
        image_pull_secrets {
          name = var.docker_secret_name
        }

        container {
          security_context {
            run_as_non_root = true
            run_as_user     = 1000
          }

          name  = "app"
          image = var.image

          env_from {
            secret_ref {
              name = kubernetes_secret.app_env.metadata[0].name
            }
          }

          liveness_probe {
            http_get {
              path = "/"
              port = 4321
            }
            initial_delay_seconds = 5
            period_seconds        = 10
            timeout_seconds       = 5
            failure_threshold     = 3
          }

          readiness_probe {
            http_get {
              path = "/"
              port = 4321
            }
            initial_delay_seconds = 5
            period_seconds        = 10
            timeout_seconds       = 5
            failure_threshold     = 3
          }

          port {
            container_port = 4321
          }
        }
      }
    }
  }
}