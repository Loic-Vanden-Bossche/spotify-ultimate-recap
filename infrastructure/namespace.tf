resource "kubernetes_namespace" "spotify_ultimate_recap" {
  metadata {
    name = "spotify-ultimate-recap"
  }
}