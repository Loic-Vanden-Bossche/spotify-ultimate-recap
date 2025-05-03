data "kubernetes_namespace" "chbrx" {
  metadata {
    name = "chbrx"
  }
}

data "kubernetes_secret" "image_pull" {
  metadata {
    name      = "ghcr-creds"
    namespace = data.kubernetes_namespace.chbrx.metadata[0].name
  }
}