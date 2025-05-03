resource "kubernetes_service" "app" {
  metadata {
    name      = "spotify-ultimate-recap-app"
    namespace = var.namespace
  }

  spec {
    selector = {
      app = "spotify-ultimate-recap-app"
    }

    port {
      port        = 4321
      target_port = 4321
    }

    type = "ClusterIP"
  }
}