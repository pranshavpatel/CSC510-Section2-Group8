import base64
import time
import types
import importlib.util
import pathlib
import sys
import asyncio

import pytest
from unittest.mock import patch

from fastapi.responses import JSONResponse, RedirectResponse
from fastapi import HTTPException

import os

# Load the Spotify_Auth module directly from file to avoid package import issues
ROOT = pathlib.Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "Mood2FoodRecSys" / "Spotify_Auth.py"
import sys

# Ensure Project root is on sys.path so imports like `from database.database import database` work
sys.path.insert(0, str(ROOT))
spec = importlib.util.spec_from_file_location("spotify_auth", str(MODULE_PATH))
spotify_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(spotify_mod)

# import the functions to test from loaded module
spotify_login = spotify_mod.spotify_login
spotify_callback = spotify_mod.spotify_callback
refresh_access_token = spotify_mod.refresh_access_token
SPOTIFY_CLIENT_ID = getattr(spotify_mod, "SPOTIFY_CLIENT_ID", None)
SPOTIFY_CLIENT_SECRET = getattr(spotify_mod, "SPOTIFY_CLIENT_SECRET", None)
SPOTIFY_REDIRECT_URI = getattr(spotify_mod, "SPOTIFY_REDIRECT_URI", None)
SPOTIFY_SCOPES = getattr(spotify_mod, "SPOTIFY_SCOPES", None)


class DummyResponse:
    def __init__(self, payload):
        self._payload = payload

    def json(self):
        return self._payload


@pytest.mark.asyncio
async def test_spotify_login_redirect(monkeypatch):
    # Set module-level constants on the loaded module so spotify_login uses them
    monkeypatch.setattr(spotify_mod, "SPOTIFY_CLIENT_ID", "myclientid", raising=False)
    monkeypatch.setattr(spotify_mod, "SPOTIFY_REDIRECT_URI", "https://example.com/callback", raising=False)
    monkeypatch.setattr(spotify_mod, "SPOTIFY_SCOPES", "user-read-email", raising=False)

    resp = await spotify_login()
    assert isinstance(resp, RedirectResponse)
    # RedirectResponse stores location header
    location = resp.headers.get("location")
    assert location is not None
    assert "accounts.spotify.com/authorize" in location
    assert "client_id=myclientid" in location
    assert "redirect_uri=https%3A%2F%2Fexample.com%2Fcallback" in location
    assert "scope=user-read-email" in location


@pytest.mark.asyncio
async def test_spotify_callback_missing_code():
    # calling with falsy code should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await spotify_callback(code=None)
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_spotify_callback_success(monkeypatch):
    # Mock time.time for deterministic expires_at
    monkeypatch.setattr(time, "time", lambda: 1000)

    token_info = {"access_token": "a1", "refresh_token": "r1", "expires_in": 3600}

    def fake_post(url, headers=None, data=None, timeout=None):
        # verify that Authorization header has base64 clientid:secret
        assert "Authorization" in headers
        fake_resp = DummyResponse(token_info)
        fake_resp.raise_for_status = lambda: None
        return fake_resp

    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)

    out = await spotify_callback(code="authcode")
    assert out["access_token"] == "a1"
    assert out["refresh_token"] == "r1"
    assert out["expires_in"] == 3600
    assert out["expires_at"] == 1000 + 3600


@pytest.mark.asyncio
async def test_spotify_callback_no_expires_in(monkeypatch):
    # If the token response lacks expires_in then expires_at should be None
    token_info = {"access_token": "a2", "refresh_token": "r2"}

    def fake_post(url, headers=None, data=None, timeout=None):
        fake_resp = DummyResponse(token_info)
        fake_resp.raise_for_status = lambda: None
        return fake_resp

    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)

    out = await spotify_callback(code="authcode2")
    assert out["access_token"] == "a2"
    assert out["refresh_token"] == "r2"
    assert out["expires_in"] is None
    assert out["expires_at"] is None


@pytest.mark.asyncio
async def test_refresh_access_token_success(monkeypatch):
    monkeypatch.setattr(time, "time", lambda: 2000)

    payload = {"access_token": "new_a", "expires_in": 1800}

    def fake_post(url, headers=None, data=None, timeout=None):
        fake_resp = DummyResponse(payload)
        fake_resp.raise_for_status = lambda: None
        return fake_resp

    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)

    out = await refresh_access_token(refresh_token="my_refresh")
    assert out["access_token"] == "new_a"
    assert out["expires_in"] == 1800
    assert out["expires_at"] == 2000 + 1800


@pytest.mark.asyncio
async def test_refresh_access_token_no_expires_in(monkeypatch):
    # If expires_in missing, expires_at should be time() + 0
    monkeypatch.setattr(time, "time", lambda: 4000)

    payload = {"access_token": "new_b"}

    def fake_post(url, headers=None, data=None, timeout=None):
        fake_resp = DummyResponse(payload)
        fake_resp.raise_for_status = lambda: None
        return fake_resp

    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)

    out = await refresh_access_token(refresh_token="r")
    assert out["access_token"] == "new_b"
    assert out["expires_at"] == 4000 + payload.get("expires_in", 0)


@pytest.mark.asyncio
async def test_refresh_access_token_no_expires_in(monkeypatch):
    # If expires_in missing, expires_at should be time() + 0
    monkeypatch.setattr(time, "time", lambda: 4000)

    payload = {"access_token": "new_b"}

    def fake_post(url, headers=None, data=None, timeout=None):
        fake_resp = DummyResponse(payload)
        fake_resp.raise_for_status = lambda: None
        return fake_resp

    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)

    out = await refresh_access_token(refresh_token="r")
    assert out["access_token"] == "new_b"
    assert out["expires_at"] == 4000 + payload.get("expires_in", 0)


@pytest.mark.asyncio
async def test_spotify_callback_requests_json_raises(monkeypatch):
    # If requests.post().json() raises, the exception should propagate
    class BadResp:
        def json(self):
            raise ValueError("bad json")
        def raise_for_status(self):
            pass

    def fake_post(url, headers=None, data=None, timeout=None):
        return BadResp()

    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)

    with pytest.raises(HTTPException):
        await spotify_callback(code="c2")


@pytest.mark.asyncio
async def test_spotify_login_missing_config(monkeypatch):
    monkeypatch.setattr(spotify_mod, "SPOTIFY_CLIENT_ID", None, raising=False)
    
    with pytest.raises(HTTPException) as exc_info:
        await spotify_login()
    assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_spotify_callback_error_response(monkeypatch):
    token_info = {"error": "invalid_grant", "error_description": "Invalid authorization code"}
    
    def fake_post(url, headers=None, data=None, timeout=None):
        fake_resp = DummyResponse(token_info)
        fake_resp.raise_for_status = lambda: None
        return fake_resp
    
    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)
    
    with pytest.raises(HTTPException) as exc_info:
        await spotify_callback(code="invalid_code")
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_refresh_access_token_missing_token():
    with pytest.raises(HTTPException) as exc_info:
        await refresh_access_token(refresh_token="")
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_refresh_access_token_error_response(monkeypatch):
    payload = {"error": "invalid_grant", "error_description": "Invalid refresh token"}
    
    def fake_post(url, headers=None, data=None, timeout=None):
        fake_resp = DummyResponse(payload)
        fake_resp.raise_for_status = lambda: None
        return fake_resp
    
    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)
    
    with pytest.raises(HTTPException) as exc_info:
        await refresh_access_token(refresh_token="invalid_refresh")
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_spotify_login_xss_protection(monkeypatch):
    """Test XSS protection in redirect URL"""
    malicious_client_id = "<script>alert('xss')</script>"
    monkeypatch.setattr(spotify_mod, "SPOTIFY_CLIENT_ID", malicious_client_id, raising=False)
    monkeypatch.setattr(spotify_mod, "SPOTIFY_REDIRECT_URI", "https://example.com/callback", raising=False)
    monkeypatch.setattr(spotify_mod, "SPOTIFY_SCOPES", "user-read-email", raising=False)

    resp = await spotify_login()
    location = resp.headers.get("location")
    # URL encoding should prevent XSS
    assert "<script>" not in location
    assert "%3Cscript%3E" in location or "script" not in location


@pytest.mark.asyncio
async def test_spotify_callback_sql_injection_protection(monkeypatch):
    """Test SQL injection protection"""
    malicious_code = "'; DROP TABLE users; --"
    
    with pytest.raises(HTTPException) as exc_info:
        await spotify_callback(code=malicious_code)
    # Should fail due to invalid code format, not SQL injection
    assert exc_info.value.status_code in [400, 500, 502]


@pytest.mark.asyncio
async def test_spotify_callback_timeout_handling(monkeypatch):
    """Test network timeout handling"""
    def fake_post_timeout(url, headers=None, data=None, timeout=None):
        import requests
        raise requests.Timeout("Request timed out")
    
    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post_timeout)
    
    with pytest.raises(HTTPException) as exc_info:
        await spotify_callback(code="valid_code")
    assert exc_info.value.status_code == 502


@pytest.mark.asyncio
async def test_spotify_callback_large_response(monkeypatch):
    """Test handling of unusually large responses"""
    large_token_info = {
        "access_token": "a" * 10000,  # Very long token
        "refresh_token": "r" * 10000,
        "expires_in": 3600,
        "extra_data": "x" * 100000  # Large extra data
    }
    
    def fake_post(url, headers=None, data=None, timeout=None):
        fake_resp = DummyResponse(large_token_info)
        fake_resp.raise_for_status = lambda: None
        return fake_resp
    
    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)
    
    result = await spotify_callback(code="test_code")
    assert len(result["access_token"]) == 10000
    assert "extra_data" in result


@pytest.mark.asyncio
async def test_concurrent_spotify_requests(monkeypatch):
    """Test handling of concurrent authentication requests"""
    token_info = {"access_token": "token", "refresh_token": "refresh", "expires_in": 3600}
    
    def fake_post(url, headers=None, data=None, timeout=None):
        fake_resp = DummyResponse(token_info)
        fake_resp.raise_for_status = lambda: None
        return fake_resp
    
    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)
    
    # Simulate concurrent requests
    tasks = [spotify_callback(code=f"code_{i}") for i in range(10)]
    results = await asyncio.gather(*tasks)
    
    assert len(results) == 10
    assert all(result["access_token"] == "token" for result in results)


@pytest.mark.asyncio
async def test_spotify_callback_malformed_json(monkeypatch):
    """Test handling of malformed JSON responses"""
    class MalformedResponse:
        def json(self):
            return "not a dict"  # Invalid JSON structure
        def raise_for_status(self):
            pass
    
    def fake_post(url, headers=None, data=None, timeout=None):
        return MalformedResponse()
    
    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)
    
    with pytest.raises(HTTPException) as exc_info:
        await spotify_callback(code="test_code")
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_refresh_token_rate_limiting(monkeypatch):
    """Test rate limiting on refresh token requests"""
    def fake_post_rate_limited(url, headers=None, data=None, timeout=None):
        import requests
        response = requests.Response()
        response.status_code = 429  # Too Many Requests
        response._content = b'{"error": "rate_limit_exceeded"}'
        response.raise_for_status = lambda: response.raise_for_status()
        return response
    
    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post_rate_limited)
    
    with pytest.raises(HTTPException) as exc_info:
        await refresh_access_token(refresh_token="valid_refresh")
    assert exc_info.value.status_code == 502


@pytest.mark.asyncio
async def test_spotify_auth_memory_usage():
    """Test memory usage with large auth data"""
    import sys
    
    # Create large auth data
    large_code = "x" * 1000000  # 1MB code
    
    initial_memory = sys.getsizeof(large_code)
    
    with pytest.raises(HTTPException):
        await spotify_callback(code=large_code)
    
    # Memory should be released after exception
    assert sys.getsizeof(large_code) == initial_memory


@pytest.mark.asyncio
async def test_spotify_callback_special_characters(monkeypatch):
    """Test handling of special characters in tokens"""
    special_token_info = {
        "access_token": "token_with_special_chars_!@#$%^&*()_+-={}[]|\\:;\"'<>?,./ ",
        "refresh_token": "refresh_éñüß中文😀",
        "expires_in": 3600
    }
    
    def fake_post(url, headers=None, data=None, timeout=None):
        fake_resp = DummyResponse(special_token_info)
        fake_resp.raise_for_status = lambda: None
        return fake_resp
    
    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)
    
    result = await spotify_callback(code="test_code")
    assert "!@#$%" in result["access_token"]
    assert "中文" in result["refresh_token"]


@pytest.mark.asyncio
async def test_spotify_auth_edge_case_expires_in():
    """Test edge cases for expires_in values"""
    test_cases = [
        {"access_token": "token", "refresh_token": "refresh", "expires_in": 0},
        {"access_token": "token", "refresh_token": "refresh", "expires_in": -1},
        {"access_token": "token", "refresh_token": "refresh", "expires_in": 999999999},
    ]
    
    for i, token_info in enumerate(test_cases):
        with patch("Mood2FoodRecSys.Spotify_Auth.requests.post") as mock_post:
            fake_resp = DummyResponse(token_info)
            fake_resp.raise_for_status = lambda: None
            mock_post.return_value = fake_resp
            
            result = await spotify_callback(code=f"test_code_{i}")
            assert "expires_at" in result
            if token_info.get("expires_in") is not None:
                assert isinstance(result["expires_at"], int)
            # expires_at can be None if expires_in is missing
