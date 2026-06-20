#!/bin/bash
set -e

echo "================================================"
echo "  Application Dashboard - Setup"
echo "================================================"

# ── Check Docker ─────────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo ""
  echo "ERROR: Docker is not installed."
  echo "Please install Docker first:"
  echo "  - Windows/Mac: https://www.docker.com/products/docker-desktop"
  echo "  - Linux: https://docs.docker.com/engine/install/"
  exit 1
fi

echo "✓ Docker found"

# ── Detect NVIDIA GPU ─────────────────────────────────────────────
GPU_AVAILABLE=false

if command -v nvidia-smi &> /dev/null; then
  if nvidia-smi &> /dev/null; then
    GPU_AVAILABLE=true
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)
    echo "✓ NVIDIA GPU detected: $GPU_NAME"
  fi
fi

# ── Install NVIDIA Container Toolkit if GPU available ─────────────
if [ "$GPU_AVAILABLE" = true ]; then
  if ! command -v nvidia-ctk &> /dev/null; then
    echo ""
    echo "Installing NVIDIA Container Toolkit for GPU acceleration..."

    curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
      | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

    curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
      | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
      | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

    sudo apt-get update -qq
    sudo apt-get install -y nvidia-container-toolkit

    sudo nvidia-ctk runtime configure --runtime=docker
    sudo service docker restart
    echo "✓ NVIDIA Container Toolkit installed"
  else
    echo "✓ NVIDIA Container Toolkit already installed"
  fi

  # Write GPU-enabled compose override
  cat > docker-compose.override.yml << 'OVERRIDE'
services:
  ollama:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
OVERRIDE
  echo "✓ GPU acceleration enabled"

else
  echo "  No NVIDIA GPU detected — will run on CPU"
  # Remove override if it exists from a previous run
  rm -f docker-compose.override.yml
fi

# ── Copy .env if missing ──────────────────────────────────────────
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "✓ Created backend/.env"
fi

# ── Launch ───────────────────────────────────────────────────────
echo ""
echo "================================================"
echo "  Starting Application Dashboard..."
echo "  This may take a few minutes on first run"
echo "  (downloading Ollama image + llama3.2 model)"
echo "================================================"
echo ""

docker compose up --build

