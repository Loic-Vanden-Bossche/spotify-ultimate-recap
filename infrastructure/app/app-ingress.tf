resource "kubernetes_ingress_v1" "app_ingress" {
  metadata {
    name      = "spotify-ultimate-recap-app-ingress"
    namespace = var.namespace
    annotations = {
      "cert-manager.io/cluster-issuer"                 = "letsencrypt-production",
      "nginx.ingress.kubernetes.io/ssl-redirect"       = "true",
      "nginx.ingress.kubernetes.io/force-ssl-redirect" = "true",
      "nginx.ingress.kubernetes.io/backend-protocol"   = "HTTP",
      "nginx.ingress.kubernetes.io/proxy-body-size"    = "10m",
      "nginx.ingress.kubernetes.io/proxy-read-timeout" = "60",
      "nginx.ingress.kubernetes.io/proxy-send-timeout" = "60"
      "nginx.ingress.kubernetes.io/proxy-body-size"    = "100m",
    }
  }

  spec {
    ingress_class_name = "nginx"

    tls {
      hosts       = [var.domain]
      secret_name = "spotify-ultimate-recap-cert"
    }

    rule {
      host = var.domain

      http {
        path {
          path      = "/"
          path_type = "Prefix"

          backend {
            service {
              name = kubernetes_service.app.metadata[0].name
              port {
                number = 4321
              }
            }
          }
        }
      }
    }
  }
}