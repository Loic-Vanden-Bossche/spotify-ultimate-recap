resource "kubernetes_service" "postgres" {
  metadata {
    name      = "spotify-ultimate-recap-postgres"
    namespace = var.namespace
  }

  spec {
    selector = {
      app = "spotify-ultimate-recap-postgres"
    }

    port {
      port        = 5432
      target_port = 5432
    }

    type = "ClusterIP"
  }
}
