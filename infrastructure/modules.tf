module "action_runners" {
  source = "./action-runners"

  repository_name    = var.repository_name
  docker_secret_name = data.kubernetes_secret.image_pull.metadata[0].name
}

# module "app" {
#   source             = "./app"
#   database_password  = ""
#   database_username  = ""
#   database_url       = ""
#   image              = "ghcr.io/${var.repository_name}:latest"
#   namespace          = kubernetes_namespace.spotify_ultimate_recap.metadata[0].name
#   domain             = var.domain
#   docker_secret_name = data.kubernetes_secret.image_pull.metadata[0].name
# }