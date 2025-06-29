import subprocess


import pytest


import time


import os



NAMESPACE = "test-namespace-load"


RELEASE_NAME = "test-release-load"


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


def test_helm_load_performance(setup_namespace):
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

    # Perform load test using a simple loop of requests
    import requests

    service_url = f"http://localhost:3000/generate"
    # Port-forward the service in background
    port_forward_cmd = [
        "kubectl",
        "port-forward",
        f"svc/{RELEASE_NAME}-frontend",
        "3000:80",
        "-n",
        NAMESPACE,
    ]
    pf_process = subprocess.Popen(port_forward_cmd)

    time.sleep(5)  # Wait for port-forward to establish

    try:
        for _ in range(50):
            response = requests.post(
                service_url,
                headers={"accept": "text/event-stream", "Content-Type": "application/json"},
                json={"text": "test load performance"},
                timeout=5,
            )
            assert response.status_code == 200, f"Request failed with status {response.status_code}"
    finally:
        pf_process.terminate()
        pf_process.wait()

    # Cleanup
    subprocess.run(["helm", "uninstall", RELEASE_NAME, "-n", NAMESPACE], check=False)
