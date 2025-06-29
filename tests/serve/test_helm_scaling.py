import subprocess


import pytest


import time


import os



NAMESPACE = "test-namespace-scaling"


RELEASE_NAME = "test-release-scaling"


HELM_CHART_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../deploy/helm/chart")
)


VALUES_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "pipeline-values.yaml")
)


@pytest.fixture(scope="module")
def setup_namespace():
    subprocess.run(["kubectl", "create", "namespace", NAMESPACE], check=False)
    yield
    subprocess.run(["kubectl", "delete", "namespace", NAMESPACE], check=False)


def test_helm_scaling(setup_namespace):
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
    time.sleep(30)

    # Scale deployment up
    scale_up_cmd = [
        "kubectl",
        "scale",
        "deployment",
        f"{RELEASE_NAME}-frontend",
        "--replicas=3",
        "-n",
        NAMESPACE,
    ]
    result = subprocess.run(scale_up_cmd, capture_output=True, text=True)
    assert result.returncode == 0, f"Scaling up failed: {result.stderr}"

    # Wait for scaling to take effect
    time.sleep(20)

    # Verify number of pods
    get_pods_cmd = [
        "kubectl",
        "get",
        "pods",
        "-n",
        NAMESPACE,
        "-l",
        f"app.kubernetes.io/instance={RELEASE_NAME}",
        "-o",
        "jsonpath={.items[*].metadata.name}",
    ]
    pods_result = subprocess.run(get_pods_cmd, capture_output=True, text=True)
    pods = pods_result.stdout.split()
    assert len(pods) >= 3, f"Expected at least 3 pods, found {len(pods)}"

    # Scale deployment down
    scale_down_cmd = [
        "kubectl",
        "scale",
        "deployment",
        f"{RELEASE_NAME}-frontend",
        "--replicas=1",
        "-n",
        NAMESPACE,
    ]
    result = subprocess.run(scale_down_cmd, capture_output=True, text=True)
    assert result.returncode == 0, f"Scaling down failed: {result.stderr}"

    # Wait for scaling to take effect
    time.sleep(20)

    # Verify number of pods
    pods_result = subprocess.run(get_pods_cmd, capture_output=True, text=True)
    pods = pods_result.stdout.split()
    assert len(pods) == 1, f"Expected 1 pod, found {len(pods)}"

    # Cleanup
    subprocess.run(["helm", "uninstall", RELEASE_NAME, "-n", NAMESPACE], check=False)
