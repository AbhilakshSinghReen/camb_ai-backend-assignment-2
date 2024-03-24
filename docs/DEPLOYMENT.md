kubectl create namespace keda
kubectl get all -n keda
kubectl delete all --all -n camb-ai
kubectl delete all --all -n keda

# Keda
kubectl apply -f https://github.com/kedacore/keda/releases/download/v2.10.1/keda-2.10.1-core.yaml

# Redis
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

kubectl apply \
  -n keda \
  -f kubernetes/redis/redis-configmap.yaml

helm upgrade --install \
  -n keda \
  keda-redis \
  bitnami/redis \
  --values kubernetes/redis/redis-values.yaml \
  --set auth.enabled=false



# Server
kubectl apply \
  -n keda \
  -f kubernetes/server/server-configmap.yaml

kubectl apply \
  -n keda \
  -f kubernetes/server/server.yaml

kubectl apply \
  -n keda \
  -f kubernetes/server/server-loadbalancer-service.yaml

# Worker
kubectl apply \
  -n keda \
  -f kubernetes/worker/worker.yaml

kubectl apply \
  -n keda \
  -f kubernetes/worker/worker-keda-scaledobject.yaml

##################################

# Loki Stack
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm upgrade --install \
  -n keda \
  monitoring-stack prometheus-community/kube-prometheus-stack \
  --values kubernetes/monitoring-stack/monitoring-values.yaml

helm upgrade --install \
  -n keda \
  promtail grafana/promtail \
  --values kubernetes/monitoring-stack/promtail-values.yaml

helm upgrade --install \
  -n keda \
  loki grafana/loki-distributed

# Get Grafana password
kubectl get secret \
  -n keda \
  monitoring-stack-grafana \
  -o jsonpath="{.data.admin-password}" \
  | base64 --decode ; echo

# Port forward Grafana
kubectl port-forward \
  -n keda \
  service/monitoring-stack-grafana \
  3000:80

