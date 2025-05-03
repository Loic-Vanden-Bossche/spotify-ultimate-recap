resource "kubernetes_manifest" "runner_deployment" {
  manifest = {
    apiVersion = "actions.summerwind.dev/v1alpha1"
    kind       = "RunnerDeployment"
    metadata = {
      name      = "spotify-ultimate-recap-runner"
      namespace = data.kubernetes_namespace.actions_runner_system.metadata[0].name
    }
    spec = {
      replicas = 1
      template = {
        spec = {
          repository = var.repository_name
          image      = "ghcr.io/loic-vanden-bossche/chbrx-infrastructure-runner:latest"
          imagePullSecrets = [
            {
              name = var.docker_secret_name
            }
          ]
        }
      }
    }
  }
}