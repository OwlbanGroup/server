import subprocess


import pytest


import os


import time



NAMESPACE = "test-namespace"


RELEASE_NAME = "test-release"


HELM_CHART_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../deploy/helm/chart")
)


VALUES_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "pipeline-values.yaml")
)


@pytest.fixture(scope="module")
def setup_namespace():
    # Create namespace
    subprocess.run(["kubectl", "create", "namespace", NAMESPACE], check=False)
    yield
    # Cleanup namespace after tests
    subprocess.run(["kubectl", "delete", "namespace", NAMESPACE], check=False)


def test_helm_install_upgrade(setup_namespace):
    # Install Helm chart
    install_cmd = [
        "helm",
        "install",
        RELEASE_NAME,
        HELM_CHART_PATH,
        "-n",
        NAMESPACE,
        "-f",
        VALUES_FILE,
    ]
    result = subprocess.run(install_cmd, capture_output=True, text=True)
    assert result.returncode == 0, f"Helm install failed: {result.stderr}"

    # Wait for pods to be ready
    time.sleep(30)  # Simple wait, can be improved with readiness checks

    # Check pods status
    pods_cmd = [
        "kubectl",
        "get",
        "pods",
        "-n",
        NAMESPACE,
        "-o",
        "jsonpath={.items[*].status.phase}",
    ]
    pods_status = subprocess.run(pods_cmd, capture_output=True, text=True)
    assert "Running" in pods_status.stdout, f"Pods not running: {pods_status.stdout}"

    # Upgrade Helm chart (simulate by re-installing)
    upgrade_cmd = [
        "helm",
        "upgrade",
        RELEASE_NAME,
        HELM_CHART_PATH,
        "-n",
        NAMESPACE,
        "-f",
        VALUES_FILE,
    ]
    result = subprocess.run(upgrade_cmd, capture_output=True, text=True)
    assert result.returncode == 0, f"Helm upgrade failed: {result.stderr}"

    # Cleanup
    subprocess.run(["helm", "uninstall", RELEASE_NAME, "-n", NAMESPACE], check=False)
