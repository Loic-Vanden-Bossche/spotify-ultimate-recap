resource "kubernetes_manifest" "runner_autoscaler" {
  manifest = {
    apiVersion = "actions.summerwind.dev/v1alpha1"
    kind       = "HorizontalRunnerAutoscaler"
    metadata = {
      name      = "spotify-ultimate-recap-autoscaler"
      namespace = data.kubernetes_namespace.actions_runner_system.metadata[0].name
    }
    spec = {
      scaleTargetRef = {
        name = kubernetes_manifest.runner_deployment.manifest.metadata.name
      }
      minReplicas = 1
      maxReplicas = 5
      metrics = [
        {
          type = "TotalNumberOfQueuedAndInProgressWorkflowRuns"
        }
      ]
    }
  }
}
