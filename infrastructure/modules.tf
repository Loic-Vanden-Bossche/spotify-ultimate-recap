module "action_runners" {
  source = "./action-runners"

  repository_name    = var.repository_name
  docker_secret_name = data.kubernetes_secret.image_pull.metadata[0].name
}

module "database" {
  source = "./database"

  namespace         = kubernetes_namespace.spotify_ultimate_recap.metadata[0].name
  database_username = var.database_username
  database_password = var.database_password
  database_name     = var.database_name
}

module "app" {
  source             = "./app"
  database_url       = module.database.url
  image              = var.app_image_tag
  migrate_image      = var.migrate_image_tag
  namespace          = kubernetes_namespace.spotify_ultimate_recap.metadata[0].name
  domain             = var.domain
  docker_secret_name = data.kubernetes_secret.image_pull.metadata[0].name
  migrate_db         = var.migrate_db
}