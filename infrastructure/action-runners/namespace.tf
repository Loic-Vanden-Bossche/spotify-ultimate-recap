data "kubernetes_namespace" "actions_runner_system" {
  metadata {
    name = "actions-runner-system"
  }
}