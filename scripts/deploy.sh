#!/bin/bash

# Vonix Network Deployment Script
# This script handles the complete deployment process for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="vonix-network"
IMAGE_TAG=${1:-latest}
REGISTRY="your-registry.com"
APP_NAME="vonix-network"

echo -e "${BLUE}🚀 Starting Vonix Network Deployment${NC}"
echo -e "${BLUE}Image Tag: ${IMAGE_TAG}${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    # Check if kubectl is installed and configured
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if we can connect to the cluster
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Function to build and push Docker images
build_and_push() {
    echo -e "${BLUE}🔨 Building and pushing Docker images...${NC}"
    
    # Build main application image
    echo "Building main application image..."
    docker build -t ${REGISTRY}/${APP_NAME}:${IMAGE_TAG} .
    docker push ${REGISTRY}/${APP_NAME}:${IMAGE_TAG}
    print_status "Main application image built and pushed"
    
    # Build Discord bot image
    echo "Building Discord bot image..."
    docker build -f Dockerfile.bot -t ${REGISTRY}/${APP_NAME}-bot:${IMAGE_TAG} .
    docker push ${REGISTRY}/${APP_NAME}-bot:${IMAGE_TAG}
    print_status "Discord bot image built and pushed"
}

# Function to create namespace if it doesn't exist
create_namespace() {
    echo -e "${BLUE}📁 Creating namespace...${NC}"
    
    if kubectl get namespace ${NAMESPACE} &> /dev/null; then
        print_warning "Namespace ${NAMESPACE} already exists"
    else
        kubectl apply -f k8s/namespace.yaml
        print_status "Namespace ${NAMESPACE} created"
    fi
}

# Function to apply ConfigMaps and Secrets
apply_configs() {
    echo -e "${BLUE}⚙️  Applying configurations...${NC}"
    
    # Apply ConfigMaps
    kubectl apply -f k8s/configmap.yaml
    print_status "ConfigMaps applied"
    
    # Check if secrets exist
    if ! kubectl get secret vonix-secrets -n ${NAMESPACE} &> /dev/null; then
        print_warning "Secrets not found. Please create them manually:"
        echo "kubectl apply -f k8s/secrets.yaml"
        echo "Make sure to replace placeholder values with actual secrets!"
        read -p "Press Enter when secrets are ready..."
    fi
}

# Function to deploy Redis
deploy_redis() {
    echo -e "${BLUE}📦 Deploying Redis...${NC}"
    
    kubectl apply -f k8s/redis-deployment.yaml
    
    # Wait for Redis to be ready
    echo "Waiting for Redis to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/redis-deployment -n ${NAMESPACE}
    print_status "Redis deployed successfully"
}

# Function to deploy main application
deploy_app() {
    echo -e "${BLUE}🌐 Deploying main application...${NC}"
    
    # Update image tag in deployment
    sed -i.bak "s|vonix/network:latest|${REGISTRY}/${APP_NAME}:${IMAGE_TAG}|g" k8s/app-deployment.yaml
    
    kubectl apply -f k8s/app-deployment.yaml
    
    # Wait for deployment to be ready
    echo "Waiting for application to be ready..."
    kubectl wait --for=condition=available --timeout=600s deployment/vonix-app-deployment -n ${NAMESPACE}
    print_status "Main application deployed successfully"
    
    # Restore original file
    mv k8s/app-deployment.yaml.bak k8s/app-deployment.yaml
}

# Function to deploy Discord bot
deploy_bot() {
    echo -e "${BLUE}🤖 Deploying Discord bot...${NC}"
    
    # Update image tag in deployment
    sed -i.bak "s|vonix/discord-bot:latest|${REGISTRY}/${APP_NAME}-bot:${IMAGE_TAG}|g" k8s/discord-bot-deployment.yaml
    
    kubectl apply -f k8s/discord-bot-deployment.yaml
    
    # Wait for deployment to be ready
    echo "Waiting for Discord bot to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/vonix-discord-bot-deployment -n ${NAMESPACE}
    print_status "Discord bot deployed successfully"
    
    # Restore original file
    mv k8s/discord-bot-deployment.yaml.bak k8s/discord-bot-deployment.yaml
}

# Function to apply ingress and HPA
apply_ingress_and_hpa() {
    echo -e "${BLUE}🌍 Applying Ingress and HPA...${NC}"
    
    kubectl apply -f k8s/ingress.yaml
    kubectl apply -f k8s/hpa.yaml
    
    print_status "Ingress and HPA applied"
}

# Function to run database migrations
run_migrations() {
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"
    
    # Get a pod name to run migrations
    POD_NAME=$(kubectl get pods -n ${NAMESPACE} -l app=vonix-app -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$POD_NAME" ]; then
        print_error "No application pods found"
        exit 1
    fi
    
    echo "Running migrations in pod: $POD_NAME"
    kubectl exec -n ${NAMESPACE} $POD_NAME -- npm run db:migrate-all
    
    print_status "Database migrations completed"
}

# Function to verify deployment
verify_deployment() {
    echo -e "${BLUE}✅ Verifying deployment...${NC}"
    
    # Check pod status
    echo "Pod status:"
    kubectl get pods -n ${NAMESPACE}
    
    # Check service status
    echo -e "\nService status:"
    kubectl get services -n ${NAMESPACE}
    
    # Check ingress status
    echo -e "\nIngress status:"
    kubectl get ingress -n ${NAMESPACE}
    
    # Check HPA status
    echo -e "\nHPA status:"
    kubectl get hpa -n ${NAMESPACE}
    
    # Health check
    echo -e "\nPerforming health check..."
    INGRESS_IP=$(kubectl get ingress vonix-ingress -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ ! -z "$INGRESS_IP" ]; then
        if curl -f -s "http://${INGRESS_IP}/api/health" > /dev/null; then
            print_status "Health check passed"
        else
            print_warning "Health check failed - application might still be starting"
        fi
    else
        print_warning "Ingress IP not available yet"
    fi
}

# Function to show deployment info
show_deployment_info() {
    echo -e "${BLUE}📊 Deployment Information${NC}"
    echo "=================================="
    echo "Namespace: ${NAMESPACE}"
    echo "Image Tag: ${IMAGE_TAG}"
    echo "Registry: ${REGISTRY}"
    echo ""
    
    # Get ingress URL
    INGRESS_HOST=$(kubectl get ingress vonix-ingress -n ${NAMESPACE} -o jsonpath='{.spec.rules[0].host}')
    if [ ! -z "$INGRESS_HOST" ]; then
        echo "Application URL: https://${INGRESS_HOST}"
    fi
    
    echo ""
    echo "Useful commands:"
    echo "  View logs: kubectl logs -f deployment/vonix-app-deployment -n ${NAMESPACE}"
    echo "  Scale app: kubectl scale deployment vonix-app-deployment --replicas=5 -n ${NAMESPACE}"
    echo "  Rollback: kubectl rollout undo deployment/vonix-app-deployment -n ${NAMESPACE}"
    echo "  Status: kubectl get all -n ${NAMESPACE}"
}

# Function to cleanup on failure
cleanup_on_failure() {
    print_error "Deployment failed. Cleaning up..."
    
    # Rollback deployments
    kubectl rollout undo deployment/vonix-app-deployment -n ${NAMESPACE} 2>/dev/null || true
    kubectl rollout undo deployment/vonix-discord-bot-deployment -n ${NAMESPACE} 2>/dev/null || true
    
    print_warning "Rollback initiated. Check the status with: kubectl get pods -n ${NAMESPACE}"
}

# Trap errors and cleanup
trap cleanup_on_failure ERR

# Main deployment flow
main() {
    echo -e "${BLUE}🎯 Starting deployment process...${NC}"
    
    check_prerequisites
    
    # Ask for confirmation in production
    if [ "$IMAGE_TAG" != "dev" ] && [ "$IMAGE_TAG" != "staging" ]; then
        echo -e "${YELLOW}⚠️  You are deploying to production with tag: ${IMAGE_TAG}${NC}"
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Deployment cancelled."
            exit 1
        fi
    fi
    
    build_and_push
    create_namespace
    apply_configs
    deploy_redis
    deploy_app
    deploy_bot
    apply_ingress_and_hpa
    
    # Wait a bit for pods to start
    echo "Waiting for pods to initialize..."
    sleep 30
    
    run_migrations
    verify_deployment
    show_deployment_info
    
    print_status "🎉 Deployment completed successfully!"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        echo -e "${BLUE}🔄 Rolling back deployment...${NC}"
        kubectl rollout undo deployment/vonix-app-deployment -n ${NAMESPACE}
        kubectl rollout undo deployment/vonix-discord-bot-deployment -n ${NAMESPACE}
        print_status "Rollback completed"
        ;;
    "status")
        echo -e "${BLUE}📊 Deployment Status${NC}"
        kubectl get all -n ${NAMESPACE}
        ;;
    "logs")
        echo -e "${BLUE}📋 Application Logs${NC}"
        kubectl logs -f deployment/vonix-app-deployment -n ${NAMESPACE}
        ;;
    "help")
        echo "Vonix Network Deployment Script"
        echo ""
        echo "Usage: $0 [command] [image-tag]"
        echo ""
        echo "Commands:"
        echo "  deploy    Deploy the application (default)"
        echo "  rollback  Rollback to previous version"
        echo "  status    Show deployment status"
        echo "  logs      Show application logs"
        echo "  help      Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 deploy v1.2.3"
        echo "  $0 rollback"
        echo "  $0 status"
        ;;
    *)
        IMAGE_TAG=$1
        main
        ;;
esac
