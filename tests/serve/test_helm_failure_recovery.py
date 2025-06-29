import subprocess


import pytest


import time


import os



NAMESPACE = "test-namespace-failure"


RELEASE_NAME = "test-release-failure"


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


def test_helm_failure_recovery(setup_namespace):
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

    # Simulate failure by deleting a pod
    get_pods_cmd = [
        "kubectl",
        "get",
        "pods",
        "-n",
        NAMESPACE,
        "-l",
        f"app.kubernetes.io/instance={RELEASE_NAME}",
        "-o",
        "jsonpath={.items[0].metadata.name}",
    ]
    pod_name_result = subprocess.run(get_pods_cmd, capture_output=True, text=True)
    pod_name = pod_name_result.stdout.strip()
    assert pod_name, "No pod found to delete"

    delete_pod_cmd = [
        "kubectl",
        "delete",
        "pod",
        pod_name,
        "-n",
        NAMESPACE,
    ]
    result = subprocess.run(delete_pod_cmd, capture_output=True, text=True)
    assert result.returncode == 0, f"Failed to delete pod: {result.stderr}"

    # Wait for pod to be recreated
    time.sleep(30)

    # Verify pod is running again
    pods_status_cmd = [
        "kubectl",
        "get",
        "pods",
        "-n",
        NAMESPACE,
        "-l",
        f"app.kubernetes.io/instance={RELEASE_NAME}",
        "-o",
        "jsonpath={.items[*].status.phase}",
    ]
    pods_status = subprocess.run(pods_status_cmd, capture_output=True, text=True)
    assert "Running" in pods_status.stdout, f"Pods not running after recovery: {pods_status.stdout}"

    # Cleanup
    subprocess.run(["helm", "uninstall", RELEASE_NAME, "-n", NAMESPACE], check=False)
