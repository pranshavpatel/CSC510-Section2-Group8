import base64
import time
import types
import importlib.util
import pathlib
import sys

import pytest

from fastapi.responses import JSONResponse, RedirectResponse

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


def test_spotify_login_redirect(monkeypatch):
    # Set module-level constants on the loaded module so spotify_login uses them
    monkeypatch.setattr(spotify_mod, "SPOTIFY_CLIENT_ID", "myclientid", raising=False)
    monkeypatch.setattr(spotify_mod, "SPOTIFY_REDIRECT_URI", "https://example.com/callback", raising=False)
    monkeypatch.setattr(spotify_mod, "SPOTIFY_SCOPES", "user-read-email", raising=False)

    resp = spotify_login()
    assert isinstance(resp, RedirectResponse)
    # RedirectResponse stores location header
    location = resp.headers.get("location")
    assert location is not None
    assert "accounts.spotify.com/authorize" in location
    assert "client_id=myclientid" in location
    assert "redirect_uri=https%3A%2F%2Fexample.com%2Fcallback" in location
    assert "scope=user-read-email" in location


def test_spotify_callback_missing_code():
    # calling with falsy code should return JSONResponse error
    resp = spotify_callback(code=None)
    assert isinstance(resp, JSONResponse)
    assert resp.status_code == 400


def test_spotify_callback_success(monkeypatch):
    # Mock time.time for deterministic expires_at
    monkeypatch.setattr(time, "time", lambda: 1000)

    token_info = {"access_token": "a1", "refresh_token": "r1", "expires_in": 3600}

    def fake_post(url, headers=None, data=None):
        # verify that Authorization header has base64 clientid:secret
        assert "Authorization" in headers
        return DummyResponse(token_info)

    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)

    out = spotify_callback(code="authcode")
    assert out["access_token"] == "a1"
    assert out["refresh_token"] == "r1"
    assert out["expires_in"] == 3600
    assert out["expires_at"] == 1000 + 3600


def test_spotify_callback_no_expires_in(monkeypatch):
    # If the token response lacks expires_in then expires_at should be None
    token_info = {"access_token": "a2", "refresh_token": "r2"}

    def fake_post(url, headers=None, data=None):
        return DummyResponse(token_info)

    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)

    out = spotify_callback(code="authcode2")
    assert out["access_token"] == "a2"
    assert out["refresh_token"] == "r2"
    assert out["expires_in"] is None
    assert out["expires_at"] is None


def test_refresh_access_token_success(monkeypatch):
    monkeypatch.setattr(time, "time", lambda: 2000)

    payload = {"access_token": "new_a", "expires_in": 1800}

    def fake_post(url, headers=None, data=None):
        return DummyResponse(payload)

    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)

    out = refresh_access_token(refresh_token="my_refresh")
    assert out["access_token"] == "new_a"
    assert out["expires_in"] == 1800
    assert out["expires_at"] == 2000 + 1800


def test_spotify_callback_auth_header_value(monkeypatch):
    # ensure Authorization header is Basic <base64(client:secret)>
    monkeypatch.setattr(spotify_mod, "SPOTIFY_CLIENT_ID", "cid123", raising=False)
    monkeypatch.setattr(spotify_mod, "SPOTIFY_CLIENT_SECRET", "csecret456", raising=False)
    monkeypatch.setattr(time, "time", lambda: 3000)

    token_info = {"access_token": "ax", "refresh_token": "rx", "expires_in": 10}

    def fake_post(url, headers=None, data=None):
        expected = base64.b64encode(b"cid123:csecret456").decode()
        assert headers["Authorization"] == f"Basic {expected}"
        return DummyResponse(token_info)

    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)
    out = spotify_callback(code="c")
    assert out["access_token"] == "ax"


def test_refresh_access_token_no_expires_in(monkeypatch):
    # If expires_in missing, expires_at should be time() + 0
    monkeypatch.setattr(time, "time", lambda: 4000)

    payload = {"access_token": "new_b"}

    def fake_post(url, headers=None, data=None):
        return DummyResponse(payload)

    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)

    out = refresh_access_token(refresh_token="r")
    assert out["access_token"] == "new_b"
    assert out["expires_at"] == 4000 + payload.get("expires_in", 0)


def test_spotify_callback_requests_json_raises(monkeypatch):
    # If requests.post().json() raises, the exception should propagate
    class BadResp:
        def json(self):
            raise ValueError("bad json")

    def fake_post(url, headers=None, data=None):
        return BadResp()

    monkeypatch.setattr("Mood2FoodRecSys.Spotify_Auth.requests.post", fake_post)

    with pytest.raises(ValueError):
        spotify_callback(code="c2")
