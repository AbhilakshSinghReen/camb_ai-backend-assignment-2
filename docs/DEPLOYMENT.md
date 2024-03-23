kubectl create namespace camb-ai

# Redis
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm upgrade --install \
  -n camb-ai \
  camb-ai-redis \
  bitnami/redis \
  --values kubernetes/redis/redis-values.yaml \
  --set auth.enabled=false

kubectl apply \
  -n camb-ai \
  -f kubernetes/redis/redis-configmap.yaml

# Loki Stack
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm upgrade --install \
  -n camb-ai \
  loki-stack grafana/loki-stack \
  --values kubernetes/loki/values.yaml 

# Get Grafana password
kubectl get secret \
  -n camb-ai \
  loki-stack-grafana \
  -o jsonpath="{.data.admin-password}" \
  | base64 --decode ; echo

# Port forward Grafana
kubectl port-forward \
  -n camb-ai \
  service/loki-stack-grafana \
  3000:80

# Server
kubectl apply -n camb-ai -f kubernetes/server/server.yaml
kubectl apply -n camb-ai -f kubernetes/server/server-loadbalancer-service.yaml
# Add HPA
