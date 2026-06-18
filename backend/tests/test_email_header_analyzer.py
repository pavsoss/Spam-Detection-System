import os
import sys
from pathlib import Path
import pytest

BASE_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = BASE_DIR / "backend"

# Ensure environment variables are loaded for testing ML endpoints if needed
os.environ.setdefault("MODEL_PATH", str(BASE_DIR / "linear_svm_model.pkl"))
os.environ.setdefault("VECTORIZER_PATH", str(BACKEND_DIR / "tfidf_vectorizer.pkl"))
os.environ.setdefault("LABEL_ENCODER_PATH", str(BASE_DIR / "label_encoder.pkl"))
os.environ.setdefault("URL_MODEL_PATH", str(BACKEND_DIR / "url_detector.pkl"))
os.environ.setdefault("URL_VECTORIZER_PATH", str(BACKEND_DIR / "url_vectorizer.pkl"))

sys.path.insert(0, str(BACKEND_DIR))

import api as api_module  # noqa: E402
from email_header_analyzer import analyze_headers  # noqa: E402

LEGIT_HEADERS = """From: Alice <alice@example.com>
Return-Path: <alice@example.com>
Authentication-Results: mx.google.com; spf=pass (google.com: domain of alice@example.com designates 192.0.2.1 as permitted sender) smtp.mailfrom=alice@example.com; dkim=pass header.i=@example.com; dmarc=pass header.from=example.com
DKIM-Signature: v=1; a=rsa-sha256; d=example.com; s=selector; h=from:to:subject; bh=hash; b=sig
Received: from mail.example.com (mail.example.com [192.0.2.1]) by mx.google.com; Wed, 17 Jun 2026 12:00:00 -0700
Subject: Hello
"""

SPOOFED_HEADERS = """From: Alice <alice@example.com>
Return-Path: <spammer@evil.com>
Authentication-Results: mx.google.com; spf=fail (google.com: domain of spammer@evil.com does not designate 192.0.2.2 as permitted sender) smtp.mailfrom=spammer@evil.com; dkim=fail header.i=@example.com; dmarc=fail header.from=example.com
DKIM-Signature: v=1; a=rsa-sha256; d=example.com; s=selector; h=from:to:subject; bh=hash; b=sig
Received: from mail.evil.com (mail.evil.com [192.0.2.2]) by mx.google.com; Wed, 17 Jun 2026 12:00:00 -0700
Subject: Hello
"""

MISSING_HEADERS = """From: Unknown <unknown@domain.com>
Return-Path: <unknown@domain.com>
Subject: Question
"""


@pytest.fixture
def client():
    api_module.app.config["TESTING"] = True
    with api_module.app.test_client() as c:
        yield c


class TestEmailHeaderAnalyzer:
    """Covers unit and integration testing of the Email Sender Authenticity module."""

    def test_legitimate_email_trusted(self):
        res = analyze_headers(LEGIT_HEADERS)
        assert res["risk_level"] == "Trusted"
        assert res["spf"] == "pass"
        assert res["dkim"] == "pass"
        assert res["dmarc"] == "pass"
        assert res["return_path_match"] is True
        assert res["sender_domain_match"] is True
        assert len(res["reasons"]) == 0

    def test_spoofed_email_high_risk(self):
        res = analyze_headers(SPOOFED_HEADERS)
        assert res["risk_level"] == "High Risk"
        assert res["spf"] == "fail"
        assert res["dkim"] == "fail"
        assert res["dmarc"] == "fail"
        assert res["return_path_match"] is False
        assert "SPF authentication failed" in res["reasons"]
        assert "DKIM authentication failed" in res["reasons"]
        assert "DMARC authentication failed" in res["reasons"]
        assert "Return-Path mismatch" in res["reasons"]

    def test_missing_auth_headers_suspicious(self):
        res = analyze_headers(MISSING_HEADERS)
        assert res["risk_level"] == "Suspicious"
        assert res["spf"] == "none"
        assert res["dkim"] == "none"
        assert res["dmarc"] == "none"
        assert "SPF authentication missing" in res["reasons"]
        assert "DKIM authentication missing" in res["reasons"]
        assert "DMARC authentication missing" in res["reasons"]

    def test_api_endpoint_legitimate(self, client):
        response = client.post("/analyze-email-header", json={"headers": LEGIT_HEADERS})
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "Trusted"
        assert data["analysis"]["sender"] == "alice@example.com"
        assert data["analysis"]["risk_level"] == "Trusted"

    def test_api_endpoint_spoofed(self, client):
        response = client.post("/analyze-email-header", json={"headers": SPOOFED_HEADERS})
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "High Risk"
        assert data["analysis"]["risk_level"] == "High Risk"

    def test_api_endpoint_missing(self, client):
        response = client.post("/analyze-email-header", json={"headers": MISSING_HEADERS})
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "Suspicious"
        assert data["analysis"]["risk_level"] == "Suspicious"

    def test_api_endpoint_missing_input_error(self, client):
        response = client.post("/analyze-email-header", json={})
        assert response.status_code == 400
        assert "error" in response.get_json()
